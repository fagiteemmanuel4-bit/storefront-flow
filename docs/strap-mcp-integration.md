# STRAP MCP integration

Status: implementation branch created; deployment is intentionally blocked pending account and project configuration.

## Decisions

- ChatGPT target: Free tier.
- Authorization UX: a dedicated STRAP OAuth consent screen.
- Data plane: Supabase Auth OAuth 2.1 + user-scoped Supabase access tokens + existing RLS.
- MCP transport: Streamable HTTP.
- Initial capability set: read-only. Write tools are a later, separately approved phase.

## Important product constraint

As of 7 November 2026, OpenAI's published requirements say custom MCP server connections are available on ChatGPT Business and Enterprise/Edu. Pro supports custom MCP with read/fetch-only permissions. Free is not listed as supported. Custom MCP setup is web-only, not available in the Android app. Therefore, deploying the server does not make it connectable from this Free account. Re-check OpenAI's plan support before attempting connection.

## Repository and deployment findings

- Repository: `fagiteemmanuel4-bit/storefront-flow`
- Production site: `https://storefront-flow.vercel.app`
- Application stack: TanStack Start, React, TypeScript, Supabase JS.
- The existing browser client uses a Supabase publishable key; no service-role key belongs in the browser.
- Supabase schema includes `stores`, `store_members`, `products`, `sales`, `sale_items`, `customers`, `branches`, `branch_stock`, and `expenses`.
- The repository's `supabase/config.toml` currently says project ref `fwcfmlqxozysksrrdfto`, while the previously inspected STRAP/Kudi Supabase project was `lhizunrljottkhemdfei`. This mismatch must be resolved by the owner before any deployment or Auth configuration. Do not deploy to either project until confirmed.
- Existing application sign-in is Supabase Auth. The requested separate auth means a dedicated MCP consent/authorization experience, not a second password database.

## Planned architecture

ChatGPT (supported plan, web)
→ `https://storefront-flow.vercel.app/api/mcp` (or a dedicated API domain)
→ OAuth 2.1 resource validation
→ Supabase Auth-issued user access token
→ Supabase queries under that user's JWT
→ existing RLS and store-membership policies.

The MCP server must never use the Supabase service-role key for merchant data queries. Every query must run with the authenticated user's token so RLS remains active. A tool must never accept an arbitrary `store_id` as authority: derive or validate accessible stores through membership policies.

## Initial read-only tool catalogue

- `strap_get_store_profile`
- `strap_list_branches`
- `strap_search_products`
- `strap_get_product`
- `strap_get_inventory_summary`
- `strap_get_low_stock`
- `strap_get_sales`
- `strap_get_sales_summary`
- `strap_get_daily_revenue`
- `strap_get_top_products`
- `strap_get_expenses`
- `strap_search_customers`
- `strap_get_customer_purchase_history`
- `strap_get_branch_inventory`

Every tool will validate inputs, cap result sizes, return only necessary fields, and scope results to stores the authenticated user can access.

## Write phase (not enabled in v1)

Potential later tools: create/update product, stock adjustment, create sale, and create customer. They require explicit role checks, confirmation semantics, idempotency, audit logging, and careful use of the existing `create_sale` RPC. No write operation should be exposed in the first release.

## Required setup before implementation can be safely completed

1. Confirm the authoritative Supabase project ref: `fwcfmlqxozysksrrdfto` or `lhizunrljottkhemdfei`.
2. In that project's Supabase dashboard, enable Auth → OAuth Server and Dynamic Client Registration.
3. Switch JWT signing to an asymmetric key (ES256 or RS256) if it is still using legacy HS256; the Supabase MCP auth integration requires asymmetric JWT verification.
4. Set the OAuth authorization path to `/oauth/consent`.
5. Implement and deploy a consent screen that authenticates the STRAP user, displays the requesting MCP client and scopes, and lets the user approve or deny. The UI must be served from the configured Supabase Auth Site URL.
6. Verify that the project's existing RLS policies correctly enforce store membership for every table used by the MCP tools. Review security advisors before release.
7. Configure the deployed MCP endpoint and its protected-resource metadata to use that exact Supabase project as issuer.
8. Add the custom MCP app from ChatGPT on the web, but only after using a ChatGPT plan that supports custom MCP. Free currently does not.

## Security requirements

- No anonymous access to merchant data.
- No service-role key in MCP request handlers.
- Verify bearer tokens on every request and reject expired, malformed, wrong-issuer, or wrong-audience tokens.
- Apply the caller's JWT to every Supabase data request; rely on RLS as the final row-level boundary.
- Require explicit consent and offer revocation.
- Limit tool output and avoid returning customer PII unless the specific tool requires it.
- Log security-relevant events without logging access tokens or sensitive customer data.
- Keep MCP tool names and schemas stable; ChatGPT snapshots tool definitions when the app is installed, so refresh/recreate the app after incompatible changes.

## References

- OpenAI: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- OpenAI MCP auth: https://developers.openai.com/plugins/build/auth
- Supabase OAuth 2.1 setup: https://supabase.com/docs/guides/auth/oauth-server/getting-started
- Supabase MCP auth: https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- Supabase MCP deployment: https://supabase.com/docs/guides/ai-tools/byo-mcp
