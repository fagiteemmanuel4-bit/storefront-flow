# Strap MCP integration

## Purpose

Strap MCP allows compatible AI clients to connect to a Strap workspace through a remote Model Context Protocol endpoint. The connection uses OAuth sign-in and a consent screen so the workspace owner can review the requested store, branch and permission scope.

## Customer-facing endpoint

`https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp`

The endpoint is hosted by the Strap production Supabase project. Do not publish private environment values, service-role credentials or internal authorization secrets.

## Connection flow

1. Add the remote endpoint in an AI client that supports remote MCP servers and OAuth authentication.
2. Complete Strap sign-in in the authorization flow.
3. Review the requested store, branch and permissions on the consent screen.
4. Approve only the access needed for the task.
5. Review or revoke existing grants from the Connected Applications area in Strap settings.

## Access boundaries

- Connections are authorised individually.
- Store and branch scope applies to branch-level operations.
- Product catalogue changes are store-wide.
- AI write access does not extend to payments, refunds, staff permissions or store deletion.
- Owners should revoke access when a client is no longer in use.

## Operational verification

Before stating that a specific AI provider is supported, verify its current remote MCP and OAuth compatibility with the live Strap authorization flow. Provider-specific setup steps can change independently of Strap.

## Customer resources

- Product guide: https://storefront-flow.vercel.app/mcp
- Documentation: https://storefront-flow.vercel.app/docs
- Help Centre: https://storefront-flow.vercel.app/support
