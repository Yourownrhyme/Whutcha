# NODE 9: VIRALITY & SOCIAL CRAWLERS

## 1. The OpenGraph Strategy
When a streamer drops their link (`viewer.html?streamer=123`) in their Twitch chat or Twitter, we must ensure it expands into a massive, highly clickable image card.
*   **Implementation:** We aggressively inject `og:title`, `twitter:card`, and large image meta tags into `viewer.html`.
*   **Agent Rule:** If regenerating or modifying `viewer.html`, NEVER strip out the OpenGraph `<meta>` block. It is essential for click-through rates.

## 2. Dynamic OpenGraph (Future Expansion)
Currently, the OG image is a static banner. In the future, we will use a Supabase Edge Function to dynamically generate an image containing the Streamer's Avatar and Username to maximize conversion.
