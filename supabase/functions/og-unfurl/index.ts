import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DEFAULT_BANNER = "https://whutcha.com/og-banner.jpg"
const DEFAULT_TITLE = "Whutcha - Zero-TOS Video Donations & Live Co-Streams"
const DEFAULT_DESC = "The elite 2026 broadcast platform. Pre-moderated OBS video queue, instant WebRTC Co-Streams, and auto-minted reaction Shorts for TikTok."

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const claim = url.searchParams.get("claim")
    const streamer = url.searchParams.get("streamer") || claim
    const targetHandle = streamer ? streamer.trim() : ""

    const userAgent = req.headers.get("user-agent") || ""
    const isBot = /(bot|crawl|spider|facebookexternalhit|twitterbot|discordbot|telegrambot|whatsapp|slackbot|applebot|linkedinbot)/i.test(userAgent)

    const destinationHost = "https://whutcha.com"
    const targetUrl = targetHandle 
      ? (claim ? `${destinationHost}/?claim=${encodeURIComponent(targetHandle)}` : `${destinationHost}/viewer.html?streamer=${encodeURIComponent(targetHandle)}`)
      : destinationHost

    // If a real human clicked the link in their browser (not a crawler), redirect directly
    if (!isBot && targetHandle) {
      return Response.redirect(targetUrl, 302)
    }

    let metaTitle = DEFAULT_TITLE
    let metaDesc = DEFAULT_DESC
    let metaImage = DEFAULT_BANNER

    if (targetHandle) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Fetch creator profile
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, platform, category, bio")
        .eq("id", targetHandle)
        .maybeSingle()

      if (!profile) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, platform, category, bio")
          .ilike("username", targetHandle)
          .maybeSingle()
        if (userProfile) profile = userProfile
      }

      const creatorName = profile?.username || targetHandle
      let escrowTotal = 0

      // Query active escrow pool for this streamer
      if (profile?.id) {
        try {
          const { data: poolData } = await supabase.rpc("get_streamer_escrow_pool", { p_streamer_id: profile.id })
          if (poolData && Number(poolData.total_amount) > 0) {
            escrowTotal = Number(poolData.total_amount)
          }
        } catch (_) {}
      }

      if (claim) {
        // Streamer Claim Pitch Unfurl
        if (escrowTotal > 0) {
          metaTitle = `🔥 $${escrowTotal.toFixed(2)} Video Bounty Waiting for @${creatorName}!`
          metaDesc = `A viewer pledged a $${escrowTotal.toFixed(2)} video message for @${creatorName}. Review in the Zero-TOS queue, accept live Co-Streams & auto-mint reaction Shorts.`
        } else {
          metaTitle = `🔥 Fan Video Roast Waiting for @${creatorName}!`
          metaDesc = `A viewer pledged a video roast for @${creatorName}'s broadcast. Pre-screened for OBS with Zero-TOS risk, live Co-Streams & auto reaction Shorts.`
        }
      } else {
        // Viewer Portal Unfurl
        metaTitle = `Send a Video Roast or Co-Stream to @${creatorName}! 🔴`
        metaDesc = `Jump directly into @${creatorName}'s broadcast. Send a pre-moderated video message or join live on stream via Whutcha Live Bridge.`
      }

      if (profile?.avatar_url && profile.avatar_url.startsWith("http")) {
        // Can use avatar or default banner
        metaImage = DEFAULT_BANNER
      }
    }

    // Return rich HTML payload for social crawlers
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(metaTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">

    <!-- OpenGraph Metadata -->
    <meta property="og:title" content="${escapeHtml(metaTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:image" content="${metaImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escapeHtml(targetUrl)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Whutcha">

    <!-- Twitter Card Metadata -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="${metaImage}">

    <meta name="theme-color" content="#060709">
</head>
<body style="background:#060709; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <div style="text-align:center; padding:20px;">
        <h1 style="color:#00f0ff;">${escapeHtml(metaTitle)}</h1>
        <p style="color:#8b949e;">${escapeHtml(metaDesc)}</p>
        <p><a href="${escapeHtml(targetUrl)}" style="color:#00f0ff; font-weight:bold;">Click here if not redirected automatically...</a></p>
    </div>
    <script>
        window.location.href = "${escapeHtml(targetUrl)}";
    </script>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      }
    })

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders })
  }
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
