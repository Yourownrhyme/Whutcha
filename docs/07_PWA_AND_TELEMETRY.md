# NODE 7: PWA, PUSH & TELEMETRY

## 1. The Mobile-First PWA & Standalone Shell
Whutcha is designed to live on the streamer's home screen and taskbar as a native desktop/mobile app.
*   **Service Worker (`sw.js`):** Manifest `whutcha-shell-v17`. Dynamically caches static shell assets for sub-50ms offline loading and Submarine Mode resilience. Handles background Push Notifications with multi-pulse vibration patterns.
*   **1-Click Install Engine (`dashboard.js`):** Intercepts `beforeinstallprompt`, surfaces a floating cyber install banner (`#pwa-install-banner`), and maintains a header quick install pill. Detects standalone execution via `matchMedia('(display-mode: standalone)')`.
*   **Mobile Cockpit Bottom Navigation Dock (`#mobile-bottom-nav`):** On screens `< 768px`, the desktop sidebar is hidden and replaced by a native thumb dock with 4 instant macros (Queue with dynamic badge, Co-Stream, Panic Kill-Switch, Settings).
*   **PWA Viewport & Safe Area Standard:** All HTML shells use `<meta name="viewport" content="..., viewport-fit=cover">`, `100dvh` (`h-dvh-screen`), and CSS safe area insets `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` to prevent clipping against dynamic islands, notch cutouts, and swipe gesture home bars.
*   **Agent Rule:** Any new icon, CSS file, or core JS file MUST be considered for the `sw.js` cache manifest. Do not break offline capabilities.

## 2. Institutional-Grade Push Notifications (PWA VAPID)
We do not use third-party spam services (like OneSignal).
*   **Infrastructure:** Native Web Push VAPID keys -> Supabase Edge Function (`/push-alert`) -> Apple/Google Push servers.
*   **Lock-Screen Delivery:** Dispatches rich vibration alerts (`[200, 100, 200, 100, 200]`) to mobile and desktop lock screens when donations or co-streams arrive.

## 3. Real-Time Alert Bridges (Discord & Telegram)
Zero-friction secondary notification channels so creators never miss a broadcast pledge:
*   **Telegram Bot Alerts Bridge:** Direct Telegram Bot API integration (`telegram-alert` Edge Function + client dispatch). Notifies streamer's private chat or channel instantly with formatted HTML cards, donor handles, amount, and quick links to Cockpit.
*   **Discord Webhook Bridge:** Real-time webhook integration (`discord-alert` Edge Function + client dispatch). Posts cyberpunk embeds with color-coded VIP tiers directly to the streamer's private Discord channel.
*   **Ninja Security:** Credentials (Discord webhook URLs, Telegram Chat IDs and Bot Tokens) are securely stored in `public.streamer_integrations` guarded by Row Level Security and SECURITY DEFINER RPCs.

## 4. Autonomous Blackbox (Telemetry)
Since there is no bundler or Node.js server monitoring the frontend, we built an autonomous "Flight Recorder".
*   `window.onerror` and `unhandledrejection` are intercepted globally.
*   Stack traces are silently pushed to the `telemetry_logs` table via REST API (bypassing the Supabase SDK to ensure delivery even if the SDK crashes).
*   *Agent Rule:* Do not introduce Sentry, Datadog, or other bloated trackers. We use our own zero-dependency telemetry.

