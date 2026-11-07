# STRAP MCP integration

Status: implementation scaffold committed on `feat/strap-mcp-integration`; the authenticated MCP Edge Function is deployed to Kudi (version 1, ACTIVE). OAuth provider configuration and end-to-end authorization testing remain pending.

## Confirmed target

- STRAP production Supabase project: `Kudi` / `lhizunrljottkhemdfei`.
- The app's browser configuration in `src/integrations/supabase/config.ts` already points to this project.
- The earlier `supabase/config.toml` project reference was stale; this branch now aligns it to Kudi.
- Production frontend: `https://storefront-flow.vercel.app`.

## Architecture

ChatGPT (supported plan, web)
→ Supabase Edge Function: `https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp`
→ Supabase OAuth 2.1 authorization server
→ authenticated MCP request pipeline
→ Supabase client scoped to the caller's JWT
→ existing Postgres RLS policies.

The MCP endpoint uses `@supabase/server`'s `withOAuthProtectedResource()` and `withSupabase({ auth: 'user' })` middleware. OAuth discovery runs before the auth gate; all tool queries use the authenticated user's client. The Edge Function gateway must have `verify_jwt = false` so unauthenticated OAuth metadata requests can reach the middleware. This does NOT make the tools public: `withSupabase({ auth: 'user' })` enforces user-token validation before the handler runs.

The consent UI is a separate STRAP route at `/oauth/consent`, but it uses the existing STRAP account and Supabase Auth. It is not a second password database. The login/OTP flow preserves the OAuth authorization request and returns the merchant to the consent screen.

## Implemented on the branch

- `supabase/functions/mcp/index.ts`: authenticated, stateless Streamable HTTP MCP endpoint.
- `supabase/functions/mcp/deno.json`: pinned Deno npm imports.
- `src/routes/oauth.consent.tsx`: separate OAuth approval/denial screen.
- `src/routes/auth.tsx` and `src/routes/verify-email.tsx`: preserve MCP consent return path through STRAP's email OTP login.
- `supabase/config.toml`: points to Kudi, sets Auth Site URL and OAuth consent path, enables OAuth server and dynamic registration, and sets the MCP Edge Function gateway to defer JWT validation to the Supabase middleware.
- Supabase Edge Function `mcp`: deployed to Kudi as version 1, ACTIVE, with `verify_jwt = false`; the function's own Supabase OAuth middleware validates every protected request.

## Initial read-only tools

1. `strap_whoami`
2. `strap_list_stores`
3. `strap_get_store_profile`
4. `strap_list_branches`
5. `strap_search_products`
6. `strap_get_low_stock`
7. `strap_get_sales`
8. `strap_get_expenses`
9. `strap_search_customers`

All store-specific tools first verify that the caller can see the requested store through RLS. Query sizes are capped. Customer search is name-only and returns only limited contact and loyalty fields. The initial version has no write tools.

## Database security inspection

The following tables have RLS enabled and member-scoped SELECT policies in Kudi: `stores`, `store_members`, `products`, `sales`, `sale_items`, `customers`, `branches`, `branch_stock`, and `expenses`. The inspected policies use `auth.uid()` and membership/role helper functions such as `private.is_store_member` and `private.has_store_role`.

The security advisor also reports existing project-wide findings: 20 SECURITY DEFINER functions executable by `anon`, 45 executable by `authenticated`, and 9 RLS-enabled tables without policies. These are pre-existing database findings, not introduced by this MCP branch. The MCP tools do not call these SECURITY DEFINER RPCs; they use direct, read-only table queries under the caller's JWT. Review the findings before broader release.

## Important ChatGPT access limitation

OpenAI's current help documentation says custom MCP connections and full MCP support are available on ChatGPT Business and Enterprise/Edu. Pro supports custom MCP with read/fetch permissions. Free is not listed as eligible. Custom MCP setup is web-only, not Android mobile. Therefore, this endpoint can be built and independently tested, but this user's Free ChatGPT account cannot currently attach it. Re-check plan eligibility before the connection step.

## Remaining production setup

1. Confirm the Auth Site URL is `https://storefront-flow.vercel.app` in Kudi's Authentication → URL Configuration.
2. In Kudi's Authentication → OAuth Server, enable OAuth 2.1 and dynamic client registration, and set Authorization Path to `/oauth/consent`.
3. Ensure JWT signing uses ES256 or RS256. The MCP middleware rejects legacy HS256 tokens.
4. Review OAuth client registrations and grants; dynamic registration is convenient but should be monitored and revocable.
5. Deploy the frontend branch to a preview and test the consent/login/OTP return flow.
6. Run the repository build, lint, type checks, and MCP Inspector handshake tests.
7. The `mcp` Edge Function is already deployed (version 1, ACTIVE) with gateway JWT verification disabled only because the function itself enforces OAuth middleware.
8. Still to test: verify unauthenticated requests receive a 401 OAuth challenge and protected-resource metadata, then verify valid tokens only see stores allowed by RLS.
9. Connect from ChatGPT web only after using an eligible plan.

## Security requirements

- Never use the service-role key for merchant queries.
- Never accept a client-supplied store ID as proof of access; check it through the caller-scoped client.
- Keep tools read-only in v1.
- Keep tool output bounded and avoid exposing unnecessary customer PII.
- Do not log bearer tokens, refresh tokens, or sensitive customer data.
- Test with at least two users from different stores to prove cross-store isolation.
- Add write tools only after role checks, explicit confirmation, idempotency, audit logging, and review of the relevant business RPCs.

## References

- OpenAI custom MCP connection requirements: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- Supabase MCP deployment and authenticated Edge Function pipeline: https://supabase.com/docs/guides/ai-tools/byo-mcp
- Supabase OAuth 2.1 setup: https://supabase.com/docs/guides/auth/oauth-server/getting-started
- Supabase MCP authentication: https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
