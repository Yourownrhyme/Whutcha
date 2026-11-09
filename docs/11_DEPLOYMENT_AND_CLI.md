# NODE 11: DEPLOYMENT & EDGE FUNCTIONS

## 1. Edge Function Deployment
Since Whutcha relies on Deno Edge Functions for secure operations (VAPID pushes, Stripe verification, LiveKit tokens), any changes to `supabase/functions/` must be deployed via the Supabase CLI.
*   **Command:** `supabase functions deploy [function-name] --project-ref kjoffilncbybquvjytxx`
*   **Secrets:** If adding new environment variables, use `supabase secrets set --project-ref ... KEY=VALUE`.

## 2. Frontend Deployment (Zero-Build)
Because the frontend has no build step (no Webpack, no Vite), deployment is a simple matter of syncing the files to the host (e.g., Netlify, Vercel, or raw Nginx).
*   **PWA Cache Busting:** If modifying core CSS/JS, remember to update the version string in `index.html` (e.g., `<script src="app.js?v=3">`) to force the Service Worker and browsers to fetch the latest version.
