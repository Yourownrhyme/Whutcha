import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      streamer_id, 
      type = "video", 
      amount = 1.00, 
      username = "Anonymous", 
      message = "", 
      is_test = false,
      chat_id = null,
      bot_token = null
    } = body

    let targetChatId = chat_id
    let targetBotToken = bot_token

    // If chat_id/bot_token not provided directly, look up from DB
    if (!targetChatId || !targetBotToken) {
      if (!streamer_id) {
        return new Response(JSON.stringify({ error: "Missing streamer_id or telegram credentials" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      const supabaseClient = createClient(supabaseUrl, supabaseKey)

      const { data: integ, error: integErr } = await supabaseClient
        .from("streamer_integrations")
        .select("telegram_chat_id, telegram_bot_token, telegram_enabled")
        .eq("user_id", streamer_id)
        .maybeSingle()

      if (integErr || !integ || !integ.telegram_chat_id || !integ.telegram_bot_token || integ.telegram_enabled === false) {
        return new Response(JSON.stringify({ success: false, reason: "Telegram not configured or disabled" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      targetChatId = integ.telegram_chat_id.trim()
      targetBotToken = integ.telegram_bot_token.trim()
    }

    const safeUsername = escapeHtml(username)
    const parsedAmount = parseFloat(amount) || 0.00
    const isCoStream = type === "costream" || (message || "").toLowerCase().includes("costream")
    const isWhale = parsedAmount >= 50

    let text = ""
    if (is_test) {
      text = `🧪 <b>Whutcha Telegram Alert Bridge: Test Ping!</b>\n\n` +
             `Your Telegram Bot is fully connected and ready to receive real-time broadcast alerts! Stream safe with Zero-TOS pre-moderation.\n\n` +
             `💵 <b>Status:</b> Operational (200 OK)\n` +
             `🛡️ <b>Queue:</b> Zero-TOS Pre-Moderated\n` +
             `⚡ <b>Quick Action:</b> <a href="https://whutcha.com/dashboard.html">Open OBS Dashboard</a>\n\n` +
             `<i>Whutcha Broadcast Protocol • Zero-TOS OBS Queue</i>`
    } else if (isWhale) {
      text = `👑 <b>WHALE SPOTTED • Premium Video Roast!</b>\n\n` +
             `👤 <b>Viewer:</b> @${safeUsername}\n` +
             `💰 <b>Amount:</b> $${parsedAmount.toFixed(2)} USD\n` +
             `🛡️ <b>Queue Status:</b> Pending Pre-Moderation (Zero-TOS)\n\n` +
             `⚡ <a href="https://whutcha.com/dashboard.html">Approve in Streamer Cockpit</a>\n\n` +
             `<i>Whutcha Broadcast Protocol</i>`
    } else if (isCoStream) {
      text = `📞 <b>Live Co-Stream Call Incoming!</b>\n\n` +
             `👤 <b>Viewer:</b> @${safeUsername}\n` +
             `💰 <b>Pledged:</b> $${parsedAmount.toFixed(2)} USD\n` +
             `🛡️ <b>Queue Status:</b> Waiting in Green Room\n\n` +
             `⚡ <a href="https://whutcha.com/dashboard.html">Connect Caller in Cockpit</a>\n\n` +
             `<i>Whutcha Live Bridge Protocol</i>`
    } else {
      text = `🎬 <b>New Fan Video Roast in Queue!</b>\n\n` +
             `👤 <b>Viewer:</b> @${safeUsername}\n` +
             `💰 <b>Amount:</b> $${parsedAmount.toFixed(2)} USD\n` +
             `🛡️ <b>Queue Status:</b> Pending Pre-Moderation\n\n` +
             `⚡ <a href="https://whutcha.com/dashboard.html">Review in Cockpit</a>\n\n` +
             `<i>Whutcha Broadcast Protocol</i>`
    }

    const tgUrl = `https://api.telegram.org/bot${targetBotToken}/sendMessage`
    const tgResp = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    })

    const tgData = await tgResp.json()

    if (!tgResp.ok || !tgData.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: tgData.description || `Telegram API error HTTP ${tgResp.status}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: tgData.result?.message_id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
