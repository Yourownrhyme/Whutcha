import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const VAPID_PUBLIC = "BIuLv038ZOyZ6_pljLAEYkaNRQme4RzMb5ufVaoPWwa-MS62EyC9_uTQj9McnUTnrrPQJM30LQH3HY-R_hwCbUs";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") || "dummy"; // Required for deployment

webpush.setVapidDetails("mailto:admin@whutcha.com", VAPID_PUBLIC, VAPID_PRIVATE);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();
    
    if (!record || !record.streamer_id) {
        return new Response(JSON.stringify({ error: "No record found" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${encodeURIComponent(record.streamer_id)}`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    
    const subscriptions = await res.json();

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return new Response(JSON.stringify({ status: "ok", message: "No active push subscriptions" }), { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const amount = parseFloat(record.amount || 0);
    const isCoStream = (record.video_hash || '').toLowerCase().includes("costream");
    const username = record.username || 'Someone';

    // 🎯 SMART PUSH NOTIFICATION ROUTING
    let title = "";
    let body = "";

    if (amount >= 100) {
        // TIER 1: The Leviathan (Extremely rare, hype)
        title = "🐋 LEVIATHAN ALERT";
        body = `${username} just dropped $${amount.toFixed(2)}! Get to the Dashboard immediately!`;
    } else if (amount >= 50) {
        // TIER 2: The Whale (High dopamine)
        title = "🔥 WHALE SPOTTED";
        body = `${username} sent $${amount.toFixed(2)}. The queue is hot!`;
    } else if (isCoStream) {
        // TIER 3: Co-Stream (Time-sensitive)
        title = "🔴 Live Co-Stream Request";
        body = `${username} paid $${amount.toFixed(2)} to jump on stream right now.`;
    } else {
        // TIER 4: Standard Video (Clean, streamer-vibe, not sterile but not clownish)
        title = "🎬 New Video Roast Dropped!";
        body = `${username} tipped $${amount.toFixed(2)} for a reaction.`;
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      url: "https://whutcha.com/dashboard.html"
    });

    const promises = subscriptions.map((sub: any) => 
      webpush.sendNotification(sub.subscription, payload).catch((e: any) => console.log("Dead token cleaned", e))
    );
    await Promise.all(promises);

    return new Response(JSON.stringify({ status: "ok", count: subscriptions.length }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
})
