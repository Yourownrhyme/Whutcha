# NODE 3: VIDEO DONATIONS & QUEUE

## 1. The Fan Experience (`viewer.html`)
1. Fan selects "Video Message".
2. Uses `MediaRecorder` API to record a WebM/MP4 blob directly in the browser (capped at 1Mbps bitrate for fast 3G uploads).
3. Pays (Simulated for MVP).
4. Video Blob is uploaded to Supabase Storage (`videos` bucket).
5. A record is inserted into the `donations` table with `status: 'pending'` and the `videoHash`.

## 2. The Admin Queue (`dashboard.html`)
1. The streamer's dashboard receives a Realtime Postgres payload.
2. The UI renders a "Pending Review" card.
3. The streamer can safely preview the video *before* their audience sees it (Solving the NSFW/TOS vulnerability).
4. Upon clicking "Approve":
   * Status changes to `approved`.
   * Streamer's local "Reaction Recorder" starts (See Node 5).

## 3. The Broadcast (`overlay.html`)
1. The OBS Browser Source is subscribed to `donations` where `status=approved`.
2. It fetches the video URL from Supabase Storage.
3. Plays the video with full UI (username, amount) overlaid on the streamer's game.

## 4. Fan Onboarding & Dead-End Elimination
1. **Direct Access Fallback (`renderNoStreamerScreen`):** If a fan lands on `viewer.html` without parameters, they are greeted by an interactive Cyber Card offering 1-click access to the Creators Directory (`leaderboard.html`) and an instant channel search bar.
2. **Missing Node Guard (`renderNotFoundScreen`):** If a user enters an uncreated channel handle, Whutcha displays a friendly "Creator Node Inactive" state with links to browse live streamers or claim the channel.
3. **Unconfigured Payout Transparency:** If a claimed streamer hasn't entered their 0% external payout link (PayPal/Boosty), `viewer.html` shows a prominent pre-flight banner informing the fan that their video donation will enter the live queue as a **Free Preview**, preventing false payment confusion.
