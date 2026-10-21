import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { streamer_id, type = "video", amount = 1.00, username = "Anonymous", message = "", is_test = false } = body

    if (!streamer_id) {
      return new Response(JSON.stringify({ error: "Missing streamer_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Lookup streamer's private Discord Webhook
    const { data: integ, error: integErr } = await supabaseClient
      .from("streamer_integrations")
      .select("discord_webhook_url, discord_enabled")
      .eq("user_id", streamer_id)
      .maybeSingle()

    if (integErr || !integ || !integ.discord_webhook_url || integ.discord_enabled === false) {
      return new Response(JSON.stringify({ success: false, reason: "Webhook not configured or disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const webhookUrl = integ.discord_webhook_url.trim()

    // Build Cyberpunk Discord Embed
    let embedTitle = "🎬 New Fan Video Roast Pledged!"
    let embedColor = 0x00f0ff // Cyan
    const parsedAmount = parseFloat(amount) || 0.00

    if (is_test) {
      embedTitle = "🧪 Whutcha Discord Alert Bridge: Test Ping!"
      embedColor = 0x10b981 // Emerald
    } else if (parsedAmount >= 100) {
      embedTitle = "🐋 LEVIATHAN ALERT • High-Value Fan Video!"
      embedColor = 0xf59e0b // Amber Gold
    } else if (parsedAmount >= 50) {
      embedTitle = "🔥 WHALE SPOTTED • Premium Video Roast!"
      embedColor = 0xf59e0b // Gold
    } else if (type === "costream") {
      embedTitle = "📞 Live Co-Stream Call Incoming!"
      embedColor = 0xa800ff // Purple
    } else if (type === "bounty") {
      embedTitle = "💰 Escrow Bounty Pledged for Your Stream!"
      embedColor = 0xf59e0b // Gold
    }

    const discordPayload = {
      username: "Whutcha Radar",
      avatar_url: "https://whutcha.com/assets/loco-kwokka.jpg",
      embeds: [
        {
          title: embedTitle,
          description: is_test 
            ? "Your Discord Webhook is fully connected and ready to receive real-time broadcast alerts! Stream safe with Zero-TOS pre-moderation."
            : `**@${username}** sent a **$${parsedAmount.toFixed(2)}** ${type === 'costream' ? 'Co-Stream call' : 'video roast'} for your live stream!`,
          color: embedColor,
          fields: [
            {
              name: "💵 Amount",
              value: `$${parsedAmount.toFixed(2)} USD`,
              inline: true
            },
            {
              name: "👤 Viewer",
              value: `@${username}`,
              inline: true
            },
            {
              name: "🛡️ Queue Status",
              value: "Pending Pre-Moderation (Zero-TOS)",
              inline: true
            },
            {
              name: "⚡ Quick Action",
              value: "[Open OBS Dashboard](https://whutcha.com/dashboard.html)",
              inline: false
            }
          ],
          thumbnail: {
            url: "https://whutcha.com/assets/loco-kwokka.jpg"
          },
          footer: {
            text: "Whutcha Broadcast Protocol • Zero-TOS OBS Queue",
            icon_url: "https://whutcha.com/icon.svg"
          },
          timestamp: new Date().toISOString()
        }
      ]
    }

    // Dispatch directly to Discord
    const discordResp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResp.ok) {
      const errText = await discordResp.text()
      console.error("Discord error:", discordResp.status, errText)
      return new Response(JSON.stringify({ error: `Discord rejected webhook: ${discordResp.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    return new Response(JSON.stringify({ success: true, message: "Alert dispatched to Discord" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("Fatal discord-alert error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
