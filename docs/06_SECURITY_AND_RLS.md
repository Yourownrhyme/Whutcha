# NODE 6: SECURITY & ROW LEVEL SECURITY (RLS)

## 1. The Database Fortress
Because Whutcha connects directly to Supabase from the client, backend security is 100% enforced via PostgreSQL Row Level Security (RLS).
*   **Rule for Agents:** NEVER assume the client can write freely to a table. All `INSERT` and `UPDATE` operations must be validated against existing RLS policies.
*   **Example:** A fan can `INSERT` a donation, but they cannot `UPDATE` its status. Only the authenticated Streamer (where `auth.uid() = streamer_id`) can `UPDATE` the status to 'approved' or 'rejected'.

## 2. Storage Privacy (Signed URLs)
Fan video donations are highly sensitive.
*   The `videos` bucket is PRIVATE.
*   The `overlay.html` uses `supabase.storage.from('videos').createSignedUrl(path, 60)` to generate a temporary link that expires in 60 seconds.
*   *Why?* To prevent viewers from inspecting the network tab, scraping the video URL, and leaking private donations.

## 3. The `auth.users` vs `public.profiles` Gap
*   Supabase handles auth in a secure, hidden schema (`auth.users`).
*   We use a Postgres Trigger (`on_auth_user_created`) to automatically clone essential public data (like `id` and `email`) into the `public.profiles` table upon registration. Agents must never try to query `auth.users` directly from the frontend.
