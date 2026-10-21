# NODE 5: REACTION RECORDER ENGINE

## 1. The "Whutcha" Unique Value Proposition
Whutcha isn't just about playing a fan's video. It's about capturing the *Streamer's Reaction* to that video and minting it as a unique, shareable piece of content (Two-way video).

## 2. Technical Implementation (Canvas + MediaRecorder)
*This is the core mechanic happening inside `dashboard.html` when a video donation is approved.*
1. **The Setup:** A hidden `<canvas>` element is created.
2. **Composition:** The Canvas draws the Streamer's local webcam feed on one side, and the Fan's playing video on the other (Picture-in-Picture or Split Screen).
3. **Recording:** `MediaRecorder` captures the Canvas stream (`canvas.captureStream(30)`) simultaneously while the Fan's video plays in the OBS Overlay.
4. **Finalization:** When the Fan's video ends, the Canvas recording stops, resulting in a compiled "Reaction Video" Blob.

## 3. Post-Processing
*   The compiled Reaction Blob is uploaded to Supabase Storage.
*   The fan receives a notification (Web Push) that their reaction video is ready to view/download.
*   *Future State:* Minting this reaction as an NFT or locking it behind a paywall.
