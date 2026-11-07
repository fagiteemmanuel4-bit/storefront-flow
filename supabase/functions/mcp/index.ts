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


type McpAccessSettings = {
  enabled: boolean;
  allowed_branch_ids: string[] | null;
  allow_products_read: boolean;
  allow_inventory_read: boolean;
  allow_sales_read: boolean;
  allow_expenses_read: boolean;
  allow_customers_read: boolean;
  allow_product_writes: boolean;
  allow_stock_writes: boolean;
};

const DEFAULT_MCP_SETTINGS: McpAccessSettings = {
  enabled: true,
  allowed_branch_ids: null,
  allow_products_read: true,
  allow_inventory_read: true,
  allow_sales_read: true,
  allow_expenses_read: true,
  allow_customers_read: true,
  allow_product_writes: false,
  allow_stock_writes: false,
};

async function getMcpSettings(supabase: UserSupabase, storeId: string): Promise<McpAccessSettings> {
  const { data, error } = await supabase
    .from("mcp_access_settings")
    .select("enabled,allowed_branch_ids,allow_products_read,allow_inventory_read,allow_sales_read,allow_expenses_read,allow_customers_read,allow_product_writes,allow_stock_writes")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...DEFAULT_MCP_SETTINGS, ...data } : DEFAULT_MCP_SETTINGS;
}

async function requireMcpPermission(
  supabase: UserSupabase,
  storeId: string,
  permission: keyof McpAccessSettings,
  branchId?: string,
) {
  await requireStoreAccess(supabase, storeId);
  const settings = await getMcpSettings(supabase, storeId);
  if (!settings.enabled) throw new Error("STRAP AI access is currently disabled for this store. Ask the store owner to enable it in Settings → AI agents.");
  if (settings[permission] !== true) throw new Error("This action is disabled in the store's STRAP AI permissions.");
  if (branchId && settings.allowed_branch_ids && !settings.allowed_branch_ids.includes(branchId)) {
    throw new Error("This branch is outside the branches authorised for AI access.");
  }
  return settings;
}

function branchFilter(settings: McpAccessSettings, request: any) {
  if (settings.allowed_branch_ids) {
    if (settings.allowed_branch_ids.length === 0) return request.in("branch_id", ["00000000-0000-0000-0000-000000000000"]);
    return request.in("branch_id", settings.allowed_branch_ids);
  }
  return request;
}

async function recordMcpAction(
  supabase: UserSupabase,
  storeId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  summary: string,
) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("The authenticated STRAP user could not be verified.");
  const { error } = await supabase.from("mcp_action_audit").insert({
    store_id: storeId,
    user_id: auth.user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    summary,
  });
  if (error) throw new Error("The change was applied, but its audit record could not be saved: " + error.message);
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
        const settings = await getMcpSettings(supabase, store_id);
        if (!settings.enabled) throw new Error("STRAP AI access is currently disabled for this store.");
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
        const settings = await requireMcpPermission(supabase, store_id, "allow_inventory_read");
        let branchQuery = supabase
          .from("branches")
          .select("id,store_id,name,address,is_default,created_at")
          .eq("store_id", store_id)
          .order("name")
          .limit(100);
        if (settings.allowed_branch_ids) branchQuery = branchQuery.in("id", settings.allowed_branch_ids.length ? settings.allowed_branch_ids : ["00000000-0000-0000-0000-000000000000"]);
        const { data, error } = await branchQuery;
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
        const settings = await requireMcpPermission(supabase, store_id, "allow_products_read");
        let request = supabase
          .from("products")
          .select("id,store_id,name,sku,barcode,category,price,cost,is_active,low_stock_threshold,units_per_pack,pack_price,piece_price")
          .eq("store_id", store_id)
          .eq("is_active", true)
          .order("name")
          .limit(clampLimit(limit));
        if (query) {
          const pattern = `%${query.replace(/[\\%_]/g, "")}%`;
          request = request.ilike("name", pattern);
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
        const settings = await requireMcpPermission(supabase, store_id, "allow_inventory_read", branch_id);
        const [productsResult, stockResult, branchesResult] = await Promise.all([
          supabase.from("products").select("id,name,sku,low_stock_threshold").eq("store_id", store_id).eq("is_active", true).limit(1000),
          branchFilter(settings, supabase.from("branch_stock").select("branch_id,product_id,quantity").eq("store_id", store_id)).limit(5000),
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
        const settings = await requireMcpPermission(supabase, store_id, "allow_sales_read");
        let request = branchFilter(settings, supabase
          .from("sales")
          .select("id,store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,created_at,customer_id")
          .eq("store_id", store_id)
          .order("created_at", { ascending: false })
          .limit(clampLimit(limit)));
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
        const settings = await requireMcpPermission(supabase, store_id, "allow_expenses_read");
        let request = branchFilter(settings, supabase
          .from("expenses")
          .select("id,store_id,branch_id,amount,category,description,expense_date,created_at")
          .eq("store_id", store_id)
          .order("expense_date", { ascending: false })
          .limit(clampLimit(limit)));
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
        await requireMcpPermission(supabase, store_id, "allow_customers_read");
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


  server.registerTool(
    "strap_get_ai_access",
    {
      title: "Inspect STRAP AI access permissions",
      description: "Show the effective branch scope and read/write permissions configured by the store owner or manager. Use this before attempting a write action.",
      inputSchema: { store_id: z.string().uuid() },
    },
    async ({ store_id }) => {
      try {
        await requireStoreAccess(supabase, store_id);
        const settings = await getMcpSettings(supabase, store_id);
        let branches: unknown[] = [];
        if (settings.allowed_branch_ids === null) {
          const { data, error } = await supabase.from("branches").select("id,name,is_default").eq("store_id", store_id).order("name").limit(100);
          if (error) throw error;
          branches = data ?? [];
        } else if (settings.allowed_branch_ids.length) {
          const { data, error } = await supabase.from("branches").select("id,name,is_default").eq("store_id", store_id).in("id", settings.allowed_branch_ids).order("name").limit(100);
          if (error) throw error;
          branches = data ?? [];
        }
        return result({
          enabled: settings.enabled,
          branch_scope: settings.allowed_branch_ids === null ? "all_branches" : "selected_branches",
          allowed_branches: branches,
          permissions: {
            products_read: settings.allow_products_read,
            inventory_read: settings.allow_inventory_read,
            sales_read: settings.allow_sales_read,
            expenses_read: settings.allow_expenses_read,
            customers_read: settings.allow_customers_read,
            products_write: settings.allow_product_writes,
            stock_write: settings.allow_stock_writes,
          },
          note: "Write tools also require the connected STRAP user to have owner or manager permissions.",
        });
      } catch (error) { return toolError(error); }
    },
  );

  server.registerTool(
    "strap_create_product",
    {
      title: "Create a product",
      description: "Create a product in an accessible STRAP store. Requires the store owner or manager to enable product write access. Use only when the user explicitly asks to add a product.",
      inputSchema: {
        store_id: z.string().uuid(),
        name: z.string().trim().min(1).max(160),
        price: z.number().min(0),
        cost: z.number().min(0).optional(),
        sku: z.string().trim().max(80).optional(),
        barcode: z.string().trim().max(100).optional(),
        category: z.string().trim().max(100).optional(),
        low_stock_threshold: z.number().int().min(0).max(100000).optional(),
        units_per_pack: z.number().int().min(1).max(100000).optional(),
        pack_price: z.number().min(0).optional(),
        piece_price: z.number().min(0).optional(),
        is_active: z.boolean().optional(),
      },
    },
    async ({ store_id, ...input }) => {
      try {
        await requireMcpPermission(supabase, store_id, "allow_product_writes");
        const { data, error } = await supabase.from("products").insert({
          store_id,
          name: input.name,
          price: input.price,
          cost: input.cost ?? 0,
          sku: input.sku ?? "",
          barcode: input.barcode ?? "",
          category: input.category ?? "",
          low_stock_threshold: input.low_stock_threshold ?? 5,
          units_per_pack: input.units_per_pack ?? 1,
          pack_price: input.pack_price ?? 0,
          piece_price: input.piece_price ?? 0,
          is_active: input.is_active ?? true,
        }).select("id,name,sku,barcode,category,price,cost,is_active,created_at").single();
        if (error) throw error;
        await recordMcpAction(supabase, store_id, "product.created", "product", data.id, "Created product: " + data.name);
        return result({ success: true, product: data });
      } catch (error) { return toolError(error); }
    },
  );

  server.registerTool(
    "strap_update_product",
    {
      title: "Update a product",
      description: "Update editable catalogue fields for an existing product in an accessible STRAP store. Requires product write access and owner/manager permissions.",
      inputSchema: {
        store_id: z.string().uuid(),
        product_id: z.string().uuid(),
        name: z.string().trim().min(1).max(160).optional(),
        price: z.number().min(0).optional(),
        cost: z.number().min(0).optional(),
        sku: z.string().trim().max(80).optional(),
        barcode: z.string().trim().max(100).optional(),
        category: z.string().trim().max(100).optional(),
        low_stock_threshold: z.number().int().min(0).max(100000).optional(),
        units_per_pack: z.number().int().min(1).max(100000).optional(),
        pack_price: z.number().min(0).optional(),
        piece_price: z.number().min(0).optional(),
        is_active: z.boolean().optional(),
      },
    },
    async ({ store_id, product_id, ...input }) => {
      try {
        await requireMcpPermission(supabase, store_id, "allow_product_writes");
        const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
        if (Object.keys(changes).length === 0) throw new Error("Provide at least one product field to update.");
        const { data, error } = await supabase.from("products").update(changes)
          .eq("id", product_id).eq("store_id", store_id)
          .select("id,name,sku,barcode,category,price,cost,is_active,updated_at").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Product not found or you do not have permission to update it.");
        await recordMcpAction(supabase, store_id, "product.updated", "product", data.id, "Updated product: " + data.name + "; fields: " + Object.keys(changes).join(", "));
        return result({ success: true, product: data, updated_fields: Object.keys(changes) });
      } catch (error) { return toolError(error); }
    },
  );

  server.registerTool(
    "strap_set_branch_stock",
    {
      title: "Set branch stock quantity",
      description: "Set the exact on-hand quantity for one product at one authorised branch. This is an absolute quantity, not an increment. Requires stock write access and owner/manager permissions.",
      inputSchema: {
        store_id: z.string().uuid(),
        branch_id: z.string().uuid(),
        product_id: z.string().uuid(),
        quantity: z.number().int().min(0).max(100000000),
      },
    },
    async ({ store_id, branch_id, product_id, quantity }) => {
      try {
        await requireMcpPermission(supabase, store_id, "allow_stock_writes", branch_id);
        const [{ data: branch, error: branchError }, { data: product, error: productError }] = await Promise.all([
          supabase.from("branches").select("id").eq("id", branch_id).eq("store_id", store_id).maybeSingle(),
          supabase.from("products").select("id,name").eq("id", product_id).eq("store_id", store_id).maybeSingle(),
        ]);
        if (branchError) throw branchError;
        if (productError) throw productError;
        if (!branch) throw new Error("Branch not found in this store.");
        if (!product) throw new Error("Product not found in this store.");
        const { data, error } = await supabase.from("branch_stock").upsert({
          store_id, branch_id, product_id, quantity, updated_at: new Date().toISOString(),
        }, { onConflict: "branch_id,product_id" }).select("branch_id,product_id,quantity,updated_at").single();
        if (error) throw error;
        await recordMcpAction(supabase, store_id, "stock.quantity_set", "product", product_id,
          "Set " + product.name + " stock to " + quantity + " at branch " + branch_id);
        return result({ success: true, stock: data, note: "The quantity was set to the exact value supplied." });
      } catch (error) { return toolError(error); }
    },
  );

}

async function handleMcpRequest(req: Request, context: { supabase: UserSupabase }) {
  const server = new McpServer({
    name: "strap",
    version: "0.2.0",
    icons: [{ src: "https://storefront-flow.vercel.app/favicon.svg", mimeType: "image/svg+xml", sizes: ["any"] }],
  });
  registerTools(server, context.supabase);

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

Deno.serve(
  pipeline(
    [withOAuthProtectedResource(), withSupabase({ auth: "user" })],
    handleMcpRequest,
  ),
);
