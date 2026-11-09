# 👁️‍🗨️ WHUTCHA - TECHNICAL MANIFEST & KNOWLEDGE GRAPH (BY SOMEBAY / TEAMPAPER)

**ATTENTION ALL DEVELOPERS AND AI AGENTS (FABLE / CURSOR / CLAUDE):**
Please read the relevant documentation nodes below before modifying code to understand the architectural and product structure of Whutcha.

## 🎯 THE WHUTCHA OVERVIEW (CORE VISION)
Whutcha is a Web Platform and PWA for the Creator Economy that introduces **Video-Donations** and **Instant Co-Streams** on live streaming platforms (Twitch, YouTube, Kick).

**The 3 Core Pillars of Whutcha:**
1. **Video-Donations (With Admin Queue):** Viewers pay to send real video messages. To protect streamers from NSFW/TOS violations on Twitch/YouTube, every video goes through a secure **Admin Queue** in the streamer's Dashboard for pre-moderation. Only approved videos hit the OBS Overlay.
2. **Universal Live Co-Streams:** Viewers can pay a premium to jump into the live broadcast. Whutcha acts as a WebRTC bridge (`Whutcha Live Bridge`), routing the viewer's camera directly into the streamer's OBS layout with a 60-second timer.
3. **Streamer Reaction Engine:** While playing the fan's video, the platform simultaneously records the streamer's reaction using `Canvas + MediaRecorder API`, generating a vertical 9:16 split-screen video ready for TikTok, Shorts, and Reels.

## 🧠 DOCUMENTATION NODES
*   📘 **[NODE 0: WHUTCHA FULL MASTER BIBLE (ОТ А ДО Я — RU & TECH ENCYCLOPEDIA)](./docs/00_WHUTCHA_FULL_BIBLE_RU.md)**
*   📂 **[NODE 1: SYSTEM ARCHITECTURE](./docs/01_ARCHITECTURE.md)** 
*   📂 **[NODE 2: ECONOMICS & GAMIFICATION](./docs/02_ECONOMICS.md)** 
*   📂 **[NODE 3: VIDEO DONATIONS & QUEUE](./docs/03_VIDEO_DONATIONS.md)** 
*   📂 **[NODE 4: WEB-RTC CO-STREAMS](./docs/04_CO_STREAMS.md)** 
*   📂 **[NODE 5: REACTION RECORDER ENGINE](./docs/05_REACTION_ENGINE.md)** 
*   📂 **[NODE 6: SECURITY & RLS](./docs/06_SECURITY_AND_RLS.md)** 
*   📂 **[NODE 7: PWA, PUSH & TELEMETRY](./docs/07_PWA_AND_TELEMETRY.md)** 
*   📂 **[NODE 8: PAYMENTS & STATE MANAGEMENT](./docs/08_PAYMENTS_AND_STATE.md)** 
*   📂 **[NODE 9: VIRALITY & SOCIAL CRAWLERS](./docs/09_VIRALITY_AND_CRAWLERS.md)** 
*   📂 **[NODE 10: OBS & BROADCAST INTEGRATION](./docs/10_OBS_INTEGRATION.md)** 
*   📂 **[NODE 11: DEPLOYMENT & EDGE FUNCTIONS](./docs/11_DEPLOYMENT_AND_CLI.md)** 

---

## 🛠️ ENGINEERING GUIDELINES
1. **Zero-Build Vanilla JS:** The frontend in `whutcha-web/` is built with pure Vanilla JavaScript, HTML5, and CSS3. Do not introduce heavy bundlers or rewrite into React/Next.js so the app remains instant and lightweight inside OBS Browser Sources.
2. **Database Architecture:** Backend state, authentication, Row Level Security (RLS), RPC functions, and Edge Functions are powered by Supabase (`supabase/`).
3. **UI Design System:** Adhere to the Dark Titanium & Glassmorphism theme defined in `whutcha-web/cyber-theme.css`.
4. **English-Only UI:** All user interfaces, alerts, and inline comments in `whutcha-web/` must remain in English for global creators and viewers.
5. **White-Label Presentation:** Present all user-facing subsystems under native Whutcha branding (`Whutcha Protocol`, `Whutcha Live Bridge`, `Whutcha Cockpit`, `Whutcha Cloud`).
