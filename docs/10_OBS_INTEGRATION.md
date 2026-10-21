# NODE 10: OBS & BROADCAST INTEGRATION

## 1. The Transparent Overlay & CEF Engine
`overlay.html` is the primary visual delivery bridge of Whutcha. It acts as a transparent Browser Source inside OBS Studio.
*   **Dimensions:** Built for standard 1920x1080 canvas with responsive fallback for non-standard CEF viewports.
*   **Audio Policy:** Runs in OBS Chromium Embedded Framework (CEF). Streamers configure "Control audio via OBS" for perfect sub-mix levels.
*   **Ninja Security:** Streamers use secure Base64 widget tokens (`?widget=ey...`) containing encrypted session identifier and timestamp rather than exposing raw database IDs in browser source URLs.

## 2. Bi-Directional Heartbeat Protocol
*   **Transmitter (`overlay.html`):** Broadcasts `obs_heartbeat` over channel `obs-overlay-${streamerId}` every 10s with `{ width, height, isObs, timestamp }`. Broadcasts `obs_disconnected` on `beforeunload`.
*   **Speedrunner Handshake (`dashboard.js`):** When the streamer opens the Cockpit, it immediately broadcasts `request_heartbeat`. If OBS is already running, the status badge turns emerald **`OBS: CONNECTED (1920x1080)`** in milliseconds.
*   **Watchdog:** A 25-second watchdog timer automatically resets the indicator to `OBS: WAITING FOR SOURCE` if OBS crashes or is closed.
*   **Signal Ping Test:** The `⚡ Test OBS Alert` button in the cockpit dispatches `ping_test`, triggering a 4-second Loco Kwokka test alert with synth chime in OBS.

## 3. Emergency Panic Kill-Switch (0ms Blackout)
The ultimate defense against Twitch/Kick TOS strikes:
*   **Cockpit Trigger:** Prominent `🚨 BLACKOUT OBS` button in the Live Queue header + global hotkeys (`ESC` or `SHIFT+K`).
*   **Zero-Latency Audio Cut (0ms):** Overlay immediately mutes all `<video>` and `<audio>` tracks (`muted = true; volume = 0; pause();`).
*   **Instant WebRTC Disconnect:** Shuts down active live Co-Stream bridge (`currentRoom.disconnect()`) without waiting for SLA timeout.
*   **Queue Purge & DB Status Update:** Volatile queue is cleared (`alertQueue.length = 0`), and active in-flight donation is marked `rejected` in Supabase to eliminate replay risks.
*   **CEF Vampire Cleanup:** Video DOM elements are destroyed and buffers released (`load()`) to prevent CEF memory leaks.

## 4. Whale Mode FX ($50+ VIP Donations)
*   **Golden Cyber Aura:** Adds dynamic `.whale-mode-active` class to `#widget-container` with animated breathing gold box-shadow (`#facc15`).
*   **VIP Hologram Badge:** Renders `👑 WHALE VIP` crown indicator and gold highlight styling on donor initial and amount.
*   **Web Audio Synth Fanfare:** Synthesizes a celebratory major chord arpeggio (C5-E5-G5-C6) natively via Web Audio API, guaranteeing zero network requests or audio CDN dependencies.

