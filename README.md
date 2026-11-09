# 👁️‍🗨️ WHUTCHA — Next-Gen Video Donations & Live Co-Streams
**By Somebay (Creators of Teampaper & Whutcha)**

> **🇷🇺 ДЛЯ ДИМЫ, СТАСА (SOMEBAY) И ИИ-АГЕНТА FABLE:**
> Полная энциклопедия проекта от «А» до «Я» (идеология, продуктовая механика, синергия с **Teampaper**, полная техническая архитектура, таблицы БД, WebRTC, 9:16 Reaction Engine и OBS-интеграция) находится здесь:
> 👉 **[📘 ЧИТАТЬ ПОЛНУЮ ЭНЦИКЛОПЕДИЮ WHUTCHA ОТ А ДО Я (`docs/00_WHUTCHA_FULL_BIBLE_RU.md`)](./docs/00_WHUTCHA_FULL_BIBLE_RU.md)**
> *(Этот файл также можно целиком скормить вашему ИИ-агенту **Fable**, чтобы он сразу изучил устройство всего проекта!)*

---

## 🎯 What is Whutcha?
**Whutcha** is a Web Platform and PWA built for live streamers (**Twitch, YouTube, Kick**) that upgrades viewer monetization and engagement beyond basic Text-to-Speech (TTS):
1. **🎬 Video-Donations with Cockpit Pre-Moderation:** Fans pay to send real video messages. Every video enters a private **Broadcaster Cockpit Queue** first—protecting streamers from NSFW/TOS bans before anything plays on stream in OBS.
2. **⚡ Instant 60-Second WebRTC Co-Streams (`Whutcha Live Bridge`):** Fans pay a premium to jump live on camera into the streamer's OBS broadcast via a moderated **Green Room** with an automatic 60-second timer.
3. **📱 Streamer Reaction Engine (`9:16 Vertical Split-Screen`):** Simultaneously records the streamer's webcam reaction alongside the fan's video donation using `Canvas + MediaRecorder API`, automatically creating a ready-to-share **9:16 Short/Reel/TikTok**.

---

## 🧠 Documentation Nodes
* 📘 **[NODE 0: Full Master Bible A-to-Z (RU & Complete Tech Spec)](./docs/00_WHUTCHA_FULL_BIBLE_RU.md)**
* 🤖 **[Technical Manifest (`AGENTS.md`)](./AGENTS.md)**
* 📂 **[NODE 1: System Architecture](./docs/01_ARCHITECTURE.md)**
* 📂 **[NODE 2: Economics & Gamification](./docs/02_ECONOMICS.md)**
* 📂 **[NODE 3: Video Donations & Queue](./docs/03_VIDEO_DONATIONS.md)**
* 📂 **[NODE 4: WebRTC Co-Streams](./docs/04_CO_STREAMS.md)**
* 📂 **[NODE 5: Reaction Recorder Engine](./docs/05_REACTION_ENGINE.md)**
* 📂 **[NODE 6: Security & RLS](./docs/06_SECURITY_AND_RLS.md)**
* 📂 **[NODE 7: PWA, Push & Telemetry](./docs/07_PWA_AND_TELEMETRY.md)**
* 📂 **[NODE 8: Payments & State Management](./docs/08_PAYMENTS_AND_STATE.md)**
* 📂 **[NODE 9: Virality & Social Crawlers](./docs/09_VIRALITY_AND_CRAWLERS.md)**
* 📂 **[NODE 10: OBS & Broadcast Integration](./docs/10_OBS_INTEGRATION.md)**
* 📂 **[NODE 11: Deployment & Edge Functions](./docs/11_DEPLOYMENT_AND_CLI.md)**

---

## 🚀 Quick Start (Zero-Build Vanilla JS)
```bash
# Start local server (Port 3000 or 3002)
npm run dev
```
