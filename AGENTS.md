# 👁️‍🗨️ WHUTCHA - MASTER AGENT MANIFEST & KNOWLEDGE GRAPH

**ATTENTION ALL AI AGENTS, LLMs, AND SUBAGENTS:**
If you are reading this file, you are part of the Whutcha development team. You MUST read the relevant documentation nodes before modifying any code. We do NOT hallucinate. We do NOT guess. We rely on the established architectural and economic constraints documented below.

## 🎯 THE WHUTCHA MANIFESTO (CORE VISION)
Whutcha is a AAA-tier Web Platform and PWA that revolutionizes the Creator Economy by introducing **Video-Donations** and **Instant Co-Streams** on platforms that don't natively support them (Twitch, YouTube, Kick).

**The 3 Pillars of Whutcha:**
1. **Video-Donations (With Admin Queue):** Text-to-Speech (TTS) is dead. Viewers pay to send *actual video messages*. To eliminate the risk of streamers being banned for NSFW/TOS violations, everything goes through a secure **Admin Queue** in the streamer's Dashboard for pre-moderation. Only approved videos hit the OBS Overlay.
2. **Universal Live Co-Streams:** Viewers can pay a premium to instantly jump into the live broadcast. Whutcha acts as a WebRTC bridge (via LiveKit), piping the fan's camera directly into the streamer's OBS layout.
3. **Streamer Reaction Engine:** The platform doesn't just play the fan's video; it simultaneously *records the streamer's unique, raw reaction* to that donation using a Canvas + MediaRecorder API, minting a unique piece of two-way content.

## 🧠 THE KNOWLEDGE GRAPH (DOCUMENTATION NODES)
To maintain context, the system is broken down into specific operational nodes. 
**Agent Instruction:** Use \`cat\` or \`view_file\` on the following paths to understand the current implementation state before touching the codebase:

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
**RULES FOR AGENTS:**
1. **Strict Context:** Do not rewrite the Vanilla JS into React/Next.js. Do not introduce build steps (Webpack/Vite).
2. **Database Truth:** The absolute source of truth for backend logic is Supabase (Tables, RPCs, pg_net Webhooks, Edge Functions). Frontend is just a lightweight client.
3. **Aesthetic Command:** Always adhere to the "Premium Gamer UI" (Glassmorphism, Dark Titanium, Liquid Silver). No generic Bootstrap-looking components.
4. **Multi-Persona Execution:** You must act as a direct **Implementer** (writing and applying working code, not just testing), a **Chief Systems Architect** (ensuring systemic integrity), a **Game Economist** (analyzing behavioral triggers, FOMO, and monetization mechanics), and an **End-User** (building a "User Roadmap" to validate the actual UX flow from a fan/streamer perspective).
5. **Anti-Hallucination & Chunking:** DO NOT attempt to write or refactor massive systems in a single response. Break large tasks into micro-subtasks. Implement Step 1, verify it, report back, and explicitly ask the user to confirm/prompt before moving to Step 2. This prevents context collapse and hallucination loops.
6. **Step-by-Step Logic:** First, write out the solution logic step-by-step, identify edge cases, and check types. Only start writing code after this analysis is complete.
7. **Strict Context Usage:** Use ONLY existing signatures and types from the provided context. If you lack data, ask the user explicitly. DO NOT hallucinate new functions or non-existent libraries.
8. **Exception for Small Fixes:** If asked for a minor, pinpoint fix (e.g., a typo or a 1-2 line adjustment), skip the heavy logical breakdown and provide the ready code immediately.
9. **English-Only UI/UX:** All applications, user interfaces, logs, and inline code comments must be STRICTLY in English. The app is built for a global market.
10. **Deep Thinking & Pacing:** Take as much time as necessary to analyze complex problems. The user is in no rush. Favor deep, rigorous thought over speed, and always break complex tasks into smaller chunks (as per Rule 5).
11. **MANDATORY WORKFLOW (Chain of Thought Checkpoint):** BEFORE writing any code or making modifications, the AI MUST output a visible block titled `[AAA-CHECK]`. In this block, the AI must explicitly list which of the 17 Stress-Test Modes apply to the current task and how it plans to address them. Skipping this step is a violation of the core directive.
12. **The Stryker Doctrine (Anti-Hallucination):** The AI must act as a mutation tester. When writing backend logic, proactively think: 'What if this rule fails? What if the user alters the payload?' Build the code to kill these logical mutants.
13. **Proprietary Secrecy & White-Label Architecture:** NEVER expose underlying third-party infrastructure vendors, service names, or backend providers (e.g., LiveKit, Supabase, Cloudflare, AWS, etc.) in any user-facing UI, subtitles, video overlays, badges, toasts, or alert messages. The platform must appear 100% proprietary. Always rebrand and present them as native Whutcha systems (e.g., 'Whutcha Live Bridge', 'Whutcha Protocol', 'Whutcha Cloud').
14. **YOLO Clearance & Full Autonomous Authority (Owner Authorized):** The project owner has explicitly granted the AI full YOLO clearance. The AI is fully empowered to proactively write, execute, refactor, and apply end-to-end features, fix bugs across files, run verification tests, and implement complete user workflows without hesitating or requiring repetitive confirmation for every intermediate step, while strictly upholding AAA stress-test modes, the Stryker Doctrine, and zero-hallucination discipline.

## 🧪 THE STRESS-TEST MODES (PRODUCT QUALITY ASSURANCE)
Every time an AI Agent writes a feature for Whutcha, it MUST mentally run the code through these specific QA Personas/Modes to ensure AAA-tier quality:

1. ⏱ **Speedrunner Mode (Time-to-Value):** How fast can a Fan complete a donation? How few clicks does it take for a Streamer to approve a video? Strip out all UI "fat" and friction.
2. 🐋 **Whale Mode (OOM / Load Resilience):** What happens if a Streamer gets 500 video donations? We cannot render 500 `<video>` tags at once. The UI must use lazy loading or pagination to prevent browser OOM (Out of Memory) crashes.
3. 🧌 **Troll Mode (Storage & Moderation Security):** Assume the user is actively trying to break the platform. What if they upload a 5GB 4K video? What if they try to bypass the Ban System? Hardcode limits and DB triggers.
4. 🤿 **Submarine Mode (PWA Edge Resilience):** The streamer's internet drops for 5 seconds. Does the app show a "White Screen of Death"? No. It gracefully shows cached data, disables buttons, and auto-reconnects Websockets when online.
5. 👵 **Grandma Mode (A11y & Contrast):** Ensure our dark Titanium/Glassmorphism UI has high enough contrast. Can a visually impaired user read the text? Can they tab through the interface?
6. ☕️ **Coffee Spill Mode (Catastrophic Failure):** If Supabase or LiveKit goes down completely, catch the error. Show a beautiful "System Offline - Reconnecting" UI, not raw console errors.
7. 📱 **Frankenstein Mode (OBS & Exotic Screens):** The `overlay.html` will be squished and stretched by Streamers inside OBS Browser Sources. Use robust flexbox/grid and `object-fit: cover` to ensure it NEVER breaks layout.
8. 🗼 **Babel Mode (Unicode Chaos):** A fan donates with the username "t̸e̵x̸t̴" or "👨‍👩‍👧‍👦". Ensure text truncation and layout constraints so Zalgo text and RTL (Right-to-Left) languages don't destroy the CSS.
9. 🤖 **Skynet Mode (Bot Protection):** Prevent script-kiddies from spamming the `create-donation` endpoint and draining our API limits.
10. 🐦 **Seagull Mode (Virality & Social Graphs):** When a fan shares the Streamer's link on Twitter/Discord, it MUST unfurl a beautiful OpenGraph image and meta title. 
11. 💊 **Dopamine Mode (Micro-interactions):** Is the app satisfying? Add haptic feedback, pulse animations, and distinct visual flair for premium ($50+) donations to trigger FOMO and reward the viewer.
12. 🧬 **The Stryker Doctrine (Anti-Hallucination):** The AI must act as a mutation tester. When writing backend logic, proactively think: "What if this rule fails? What if the user alters the payload?" Build the code to kill these logical mutants.
13. 🦇 **Vampire Mode (Battery & CPU Drain):** The Streamer leaves the Dashboard open for an 8-hour stream. Do memory leaks or unpaused hidden `<video>` tags melt their CPU and drain RAM? Ensure WebRTC tracks and Canvas loops are completely destroyed when modals close.
14. 🤤 **Dumb User / Homer Simpson Mode (Zero Context):** The user doesn't read instructions. They ignore text and click the biggest button. Is the UI foolproof? If a fan lands on `viewer.html`, is it immediately, visually obvious they need to record a video, or will they get stuck?
15. 🤡 **Chaos Monkey / Toddler Mode (Rage Clicking):** A fan impatiently taps the "Pay & Send" button 15 times in one second. Does the app charge them 15 times? Enforce strict button debouncing, disabled states, and loading spinners instantly upon interaction.
16. 🕵️‍♂️ **Ninja Mode (Privacy & Data Leaks):** Are we accidentally exposing the Streamer's email in the raw DOM? Is the OBS Overlay URL secure, or can a random viewer find it and hijack the broadcast? Sanitize all data payloads.
17. 🕰️ **Time Traveler Mode (Expired State):** A streamer leaves the Dashboard open overnight, then clicks "Approve" on a 12-hour-old donation. Supabase auth tokens or Signed Video URLs expire. The app must gracefully detect expired sessions and re-authenticate or refresh tokens silently, rather than crashing.
