# NODE 2: ECONOMICS & GAMIFICATION

## 1. Dynamic Pricing Strategy
Fans don't just see a static price. `viewer.html` dynamically injects multipliers `[1x, 2x, 5x, 10x]` based on the streamer's base price. 
*   *Psychological Effect:* Normalizes higher spending by making the 5x or 10x buttons highly accessible and visually appealing (Whale hunting).

## 2. Scarcity & Urgency (SLA Timers)
When a Co-Stream is approved, the streamer's UI activates a **60-Second Countdown**.
*   *Mechanic:* The fan has exactly 60 seconds (or 15 seconds SLA) to join the room via LiveKit, otherwise the room is nuked and the connection drops.
*   *Psychological Effect:* Creates massive FOMO and urgency for the fan to get ready and jump on screen, treating the streamer's time as a highly scarce, premium resource.

## 3. The Leaderboard (Creator of the Day)
Located on the `index.html` splash screen.
*   *Mechanic:* Ranks streamers by total revenue generated (sum of approved donations) over specific time windows (Today, Week, Month).
*   *Psychological Effect:* Introduces competition among creators, turning monetization into a status symbol (Product Hunt style).
