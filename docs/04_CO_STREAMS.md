# NODE 4: WEB-RTC CO-STREAMS

## 1. Concept
Allow viewers to jump onto the streamer's live broadcast instantly, bringing native Co-Streaming to YouTube and Twitch.

## 2. WebRTC Infrastructure (LiveKit)
We use LiveKit Cloud for zero-latency video routing.
*   **Edge Function:** When a Co-Stream is requested/approved, the `livekit-token` Deno Edge function generates secure JWT tokens for both the Streamer (Admin) and the Viewer (Participant).
*   **Room ID:** The `donation.id` acts as the secure Room Name.

## 3. The Flow
1. Fan requests Co-Stream (`viewer.html`).
2. Streamer clicks "Accept" (`dashboard.html`).
3. Dashboard invokes the Edge Function, gets tokens, connects to LiveKit, and updates the DB with the `viewer_token`.
4. Fan's `viewer.html` detects the token in the DB via Realtime, connects their camera, and pushes the track to the room.
5. Streamer's Dashboard receives the remote video track and renders it.

## 4. Anti-Echo & Memory Leaks
*   **Anti-Echo:** The Dashboard mutes the remote audio track by default (or selectively) to prevent audio looping, since the streamer will capture it via Desktop Audio in OBS.
*   **Memory Leaks (Ghost Cameras):** When a room is closed, we explicitly call `room.disconnect()` and `stream.getTracks().forEach(t => t.stop())` to release hardware resources.
