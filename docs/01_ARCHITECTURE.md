# NODE 1: SYSTEM ARCHITECTURE

## 1. Frontend Philosophy (Zero-Build Step)
*   **Tech:** Pure Vanilla JavaScript (ES Modules), HTML5, Tailwind CSS (via CDN).
*   **Reasoning:** Extreme speed, zero compilation time, easy debugging on any machine.
*   **Core Files:**
    *   `index.html`: Auth/Splash Screen + Gamified Leaderboard.
    *   `dashboard.html`: The Streamer's control center (Admin Queue).
    *   `viewer.html`: The Fan's interface (Record video / Request Co-Stream).
    *   `overlay.html`: The invisible Browser Source for OBS.

## 2. Backend Philosophy (Database-Driven)
*   **Tech:** Supabase (PostgreSQL).
*   **Tables:** 
    *   `profiles` (Streamer config, prices, avatar).
    *   `donations` (The central nervous system linking fans and streamers).
    *   `push_subscriptions` (For Web-Push alerts).
*   **Security:** RLS (Row Level Security) is used. Some RPC functions (like `get_leaderboard`) use `SECURITY DEFINER` to safely bypass RLS for aggregate data.

## 3. Middleware & Realtime
*   **Edge Functions (Deno):** Used for secrets (LiveKit token generation, Push Notification triggering).
*   **Webhooks (`pg_net`):** Supabase database webhooks trigger Edge Functions automatically on `INSERT` to the `donations` table.
*   **Realtime:** The frontend uses `supabase.channel` to subscribe to database changes instantly (e.g., Dashboard listening for new donations, Overlay listening for 'approved' status).

## 4. Broadcaster Quickstart Onboarding Engine
*   **Zero-Friction First Run:** To eliminate Homer Simpson confusion, `dashboard.html` features an interactive 4-step checklist:
    1. **Set Handle & Payout Destination:** Ensures peer-to-peer 0% fee bypass (PayPal/Boosty/Stripe) and replaces raw auth UUID with a clean handle.
    2. **Connect OBS Studio Browser Source:** Integrated with the bi-directional heartbeat protocol (`obs_heartbeat`), auto-marking complete the instant OBS connects.
    3. **Test Broadcast Alert:** 1-click test ping with Web Audio chime and visual overlay preview.
    4. **Share Fan Portal Link:** Automatically copies a clean `@handle` link for Twitch/Kick chat and panels.
*   **State Persistence:** Stores step completions and collapse preferences in `localStorage` (`whutcha_onboarding_*`) with reactive auto-updates on relevant actions.
