import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { pipeline } from "npm:@supabase/middleware@1";
import { withOAuthProtectedResource, withSupabase } from "npm:@supabase/server@1";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { z } from "npm:zod@4";

type UserSupabase = {
  auth: { getUser: () => Promise<{ data: { user: { id: string; email?: string } | null }; error: Error | null }> };
  from: (table: string) => any;
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : "The requested STRAP data could not be loaded.";
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

function clampLimit(value: number | undefined) {
  return Math.max(1, Math.min(MAX_LIMIT, value ?? DEFAULT_LIMIT));
}

async function requireStoreAccess(supabase: UserSupabase, storeId: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("id,name,currency")
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Store not found or you do not have permission to access it.");
  return data;
}

function registerTools(server: McpServer, supabase: UserSupabase) {
  server.registerTool(
    "strap_whoami",
    {
      title: "Identify STRAP account",
      description: "Use this first to confirm which STRAP account is connected. Returns the authenticated account identity only.",
      inputSchema: {},
    },
    async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) throw new Error("No authenticated STRAP user was found.");
        return result({ user_id: data.user.id, email: data.user.email ?? null });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_list_stores",
    {
      title: "List accessible stores",
      description: "List the STRAP stores the connected user is allowed to access. Use this to discover a store_id before calling store-specific tools.",
      inputSchema: {},
    },
    async () => {
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("id,name,currency,business_type,created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_get_store_profile",
    {
      title: "Get store profile",
      description: "Read the profile of a store the connected STRAP user can access.",
      inputSchema: { store_id: z.string().uuid() },
    },
    async ({ store_id }) => {
      try {
        const store = await requireStoreAccess(supabase, store_id);
        const { data, error } = await supabase
          .from("stores")
          .select("id,name,currency,tax_rate,low_stock_threshold,business_type,team_size,phone,address,logo_url,created_at")
          .eq("id", store.id)
          .maybeSingle();
        if (error) throw error;
        return result(data);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_list_branches",
    {
      title: "List store branches",
      description: "List branches belonging to a store the connected user can access.",
      inputSchema: { store_id: z.string().uuid() },
    },
    async ({ store_id }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        const { data, error } = await supabase
          .from("branches")
          .select("id,store_id,name,address,is_default,created_at")
          .eq("store_id", store_id)
          .order("name")
          .limit(100);
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_search_products",
    {
      title: "Search store products",
      description: "Search active products by name, SKU, or barcode within an accessible store. Use this when the user asks about a product, its price, or its catalogue details.",
      inputSchema: {
        store_id: z.string().uuid(),
        query: z.string().trim().max(120).optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      },
    },
    async ({ store_id, query, limit }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        let request = supabase
          .from("products")
          .select("id,store_id,name,sku,barcode,category,price,cost,is_active,low_stock_threshold,units_per_pack,pack_price,piece_price")
          .eq("store_id", store_id)
          .eq("is_active", true)
          .order("name")
          .limit(clampLimit(limit));
        if (query) {
          const pattern = `%${query.replace(/[\\%_]/g, "")}%`;
          request = request.or(`name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`);
        }
        const { data, error } = await request;
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_get_low_stock",
    {
      title: "Find low-stock products",
      description: "Find products whose recorded branch quantity is at or below their configured low-stock threshold. Optionally narrow the result to one branch.",
      inputSchema: {
        store_id: z.string().uuid(),
        branch_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      },
    },
    async ({ store_id, branch_id, limit }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        const [productsResult, stockResult, branchesResult] = await Promise.all([
          supabase.from("products").select("id,name,sku,low_stock_threshold").eq("store_id", store_id).eq("is_active", true).limit(1000),
          supabase.from("branch_stock").select("branch_id,product_id,quantity").eq("store_id", store_id).limit(5000),
          supabase.from("branches").select("id,name").eq("store_id", store_id).limit(100),
        ]);
        if (productsResult.error) throw productsResult.error;
        if (stockResult.error) throw stockResult.error;
        if (branchesResult.error) throw branchesResult.error;

        const productById = new Map((productsResult.data ?? []).map((p: any) => [p.id, p]));
        const branchById = new Map((branchesResult.data ?? []).map((b: any) => [b.id, b.name]));
        const lowStock = (stockResult.data ?? [])
          .filter((stock: any) => !branch_id || stock.branch_id === branch_id)
          .flatMap((stock: any) => {
            const product: any = productById.get(stock.product_id);
            if (!product) return [];
            const threshold = Number(product.low_stock_threshold ?? 0);
            if (Number(stock.quantity ?? 0) > threshold) return [];
            return [{
              product_id: product.id,
              product_name: product.name,
              sku: product.sku,
              branch_id: stock.branch_id,
              branch_name: branchById.get(stock.branch_id) ?? null,
              quantity: Number(stock.quantity ?? 0),
              low_stock_threshold: threshold,
            }];
          })
          .sort((a: any, b: any) => a.quantity - b.quantity)
          .slice(0, clampLimit(limit));
        return result({ items: lowStock, note: "Results are based on recorded branch_stock rows. Products without a branch_stock row are not included." });
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_get_sales",
    {
      title: "Read sales",
      description: "Read recent sales for an accessible store, optionally filtered by an ISO-8601 start and end timestamp. Does not create or change sales.",
      inputSchema: {
        store_id: z.string().uuid(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      },
    },
    async ({ store_id, from, to, limit }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        let request = supabase
          .from("sales")
          .select("id,store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,created_at,customer_id")
          .eq("store_id", store_id)
          .order("created_at", { ascending: false })
          .limit(clampLimit(limit));
        if (from) request = request.gte("created_at", from);
        if (to) request = request.lte("created_at", to);
        const { data, error } = await request;
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_get_expenses",
    {
      title: "Read store expenses",
      description: "Read expenses for an accessible store, optionally filtered by expense date. Results are capped and read-only.",
      inputSchema: {
        store_id: z.string().uuid(),
        from: z.string().date().optional(),
        to: z.string().date().optional(),
        limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
      },
    },
    async ({ store_id, from, to, limit }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        let request = supabase
          .from("expenses")
          .select("id,store_id,branch_id,amount,category,description,expense_date,created_at")
          .eq("store_id", store_id)
          .order("expense_date", { ascending: false })
          .limit(clampLimit(limit));
        if (from) request = request.gte("expense_date", from);
        if (to) request = request.lte("expense_date", to);
        const { data, error } = await request;
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    "strap_search_customers",
    {
      title: "Search store customers",
      description: "Search customers by name in an accessible store. Returns limited customer contact and loyalty summary fields; use only when the user asks about customers.",
      inputSchema: {
        store_id: z.string().uuid(),
        query: z.string().trim().min(1).max(100),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ store_id, query, limit }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        const { data, error } = await supabase
          .from("customers")
          .select("id,name,phone,email,total_spent,visit_count,last_visit_at")
          .eq("store_id", store_id)
          .ilike("name", `%${query.replace(/[\\%_]/g, "")}%`)
          .order("name")
          .limit(Math.min(50, clampLimit(limit)));
        if (error) throw error;
        return result(data ?? []);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}

async function handleMcpRequest(req: Request, context: { supabase: UserSupabase }) {
  const server = new McpServer({
    name: "strap",
    version: "0.1.0",
  });
  registerTools(server, context.supabase);

  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  return transport.handleRequest(req);
}

Deno.serve(
  pipeline(
    [withOAuthProtectedResource(), withSupabase({ auth: "user" })],
    handleMcpRequest,
  ),
);
