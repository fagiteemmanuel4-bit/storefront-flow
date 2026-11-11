# STRAP MCP integration

Status: live on Kudi Supabase project `lhizunrljottkhemdfei`. The authenticated MCP Edge Function is ACTIVE at version 11.

## Endpoint and architecture

- MCP endpoint: `https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp`
- STRAP production frontend: `https://storefront-flow.vercel.app`
- Source of truth: `supabase/functions/mcp/index.ts` and `supabase/functions/mcp/deno.json`

ChatGPT or another supported MCP client
→ Supabase Edge Function
→ Supabase OAuth 2.1 middleware
→ caller-scoped Supabase client
→ existing Postgres RLS and Storage policies.

The endpoint uses `withOAuthProtectedResource()` and `withSupabase({ auth: "user" })`. Gateway `verify_jwt = false` is required so OAuth metadata and challenge requests reach the middleware; protected tool calls still require a valid OAuth user token. Merchant operations never use the service-role key.

## Available tools

Identity and discovery:

1. `strap_whoami`
2. `strap_list_stores`
3. `strap_get_store_profile`
4. `strap_list_branches`

Read: 5. `strap_search_products` (includes product `image_url`) 6. `strap_get_low_stock` 7. `strap_get_sales` 8. `strap_get_expenses` 9. `strap_search_customers` 10. `strap_get_ai_access`

Writes (connected app must be explicitly granted the relevant permission; caller must be a store owner or manager): 11. `strap_create_product` 12. `strap_update_product` 13. `strap_set_branch_stock` 14. `strap_upload_image`

## Image upload

`strap_upload_image` uploads a product image to the existing public `connect-product-images` bucket. The tool accepts:

- `store_id`: the accessible STRAP store UUID.
- `image_base64`: raw base64 bytes, without a data-URL prefix.
- `mime_type`: `image/jpeg`, `image/png`, `image/webp`, or `image/avif`.
- `product_id` (optional): attach the uploaded image to an existing product in the same store.

Images are limited to 8 MiB. The function checks the actual file signature against the declared MIME type before upload. Paths are scoped under the authenticated user's ID and store ID to satisfy the bucket's owner-folder Storage policies. Uploads use unique object names (no overwrite). When `product_id` is supplied, the tool updates `products.image_url`, returns the public URL and updated product, and writes an audit event. If the product update fails, the uploaded object is removed.

Image uploads require the connected application's existing `allow_product_writes` grant and owner/manager role. No new permission toggle or database migration is required. The image bucket is public-read by design; writes remain authenticated and owner-folder scoped.

## Access controls and audit

- Each OAuth client has an individual `mcp_client_access_settings` consent record.
- Store access is checked with the caller-scoped Supabase client and RLS.
- Product and stock writes are disabled unless explicitly enabled for that connected app.
- Write operations require a STRAP store owner or manager and are audited through `record_mcp_action`.
- Optional branch restrictions are enforced for branch-scoped operations.
- Tool output is bounded; internal product cost and margin fields are not returned.
- No service-role key is used for merchant data or Storage operations.

## ChatGPT access limitation

Custom MCP connection availability depends on the ChatGPT plan and is configured from ChatGPT web. Confirm current plan eligibility before attempting to connect the endpoint; mobile apps may not expose the setup flow.

## Operational notes

- Deploy the Edge Function from `supabase/functions/mcp` with `deno.json` as its import map.
- Keep the deployed function and repository source synchronized.
- Test OAuth challenge/metadata, authenticated tool discovery, denied permissions, allowed uploads, invalid MIME signatures, oversize images, cross-store product IDs, and product image URL persistence after each deployment.
- Do not log bearer tokens, refresh tokens, base64 image payloads, or sensitive customer data.

## References

- Supabase Storage uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase JavaScript Storage upload: https://supabase.com/docs/reference/javascript/file-buckets-upload
- Supabase MCP authentication: https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
