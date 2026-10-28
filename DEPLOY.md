# Deploying Strap to Vercel

The app is a TanStack Start (Vite + Nitro) project. Nitro auto-detects Vercel
during the build and emits the Build Output API bundle at `.vercel/output`, so
no adapter wiring is needed — `vercel.json` just pins the build command.

## 1. Import the repo

In Vercel: **Add New → Project → Import Git Repository**. Leave the framework
preset as "Other" (`vercel.json` already sets `framework: null`).

- Build command: `npm run build`
- Output directory: leave empty (Nitro writes `.vercel/output`)
- Node version: 20 or newer

## 2. Environment variables

Add these to **Project → Settings → Environment Variables** for Production,
Preview and Development:

| Name                            | Value                                       |
| ------------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`             | your backend URL                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable (anon) key — safe in the browser |
| `VITE_SUPABASE_PROJECT_ID`      | project ref                                 |
| `SUPABASE_URL`                  | same as `VITE_SUPABASE_URL` (server side)    |
| `SUPABASE_PUBLISHABLE_KEY`      | same publishable key (server side)           |

Copy the values from the local `.env` file. Never add the service-role key
unless a server function actually needs it.

## 3. Auth redirect URLs

After the first deploy, add the Vercel domain (e.g.
`https://kudi.vercel.app`) to the backend auth settings as both the **Site URL**
and an allowed **Redirect URL**, otherwise Google sign-in bounces back to the
preview domain.

## 4. Optional: pin the preset

If your CI does not run on Vercel but you still want Vercel output, set
`NITRO_PRESET=vercel` as a build env var, or pass it explicitly:

```ts
// vite.config.ts
export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: { server: { entry: "server" } },
});
```
