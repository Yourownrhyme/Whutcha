import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for web requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const username = (body.username || 'Anonymous').slice(0, 25)
    const amount = parseFloat(body.amount)
    const videoHash = body.video_hash || body.videoHash
    const streamerId = body.streamer_id || body.streamerId
    const donationId = body.id || ('WTCH-' + Math.floor(100000 + Math.random() * 900000))
    const viewerDeviceId = body.viewer_device_id || body.viewerDeviceId || 'dev_anon'
    const bountyMessage = (body.bounty_message || body.payment_memo || '').slice(0, 80) || null
    const isEscrow = Boolean(body.is_escrow)

    if (isNaN(amount) || amount <= 0 || !videoHash || !streamerId) {
      return new Response(JSON.stringify({ error: 'Missing or invalid required fields (amount, video_hash, streamer_id)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    
    // Create Supabase client with SERVICE_ROLE key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
         global: {
           headers: {
             'x-forwarded-for': clientIp
           }
         }
      }
    )

    // Insert donation into public ledger
    const { data, error } = await supabaseClient
      .from('donations')
      .insert([
        {
          id: donationId,
          streamer_id: streamerId,
          viewer_device_id: viewerDeviceId,
          username: username,
          amount: amount,
          video_hash: videoHash,
          "videoHash": videoHash,
          status: isEscrow ? 'escrow' : 'pending',
          is_escrow: isEscrow,
          bounty_message: bountyMessage
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.message && error.message.includes('SKYNET_BLOCKED')) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 60 seconds before sending another donation.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      if (error.message && error.message.includes('blocked by this broadcaster')) {
        return new Response(JSON.stringify({ error: 'Device restricted: You have been blocked by this broadcaster.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      throw error
    }

    return new Response(JSON.stringify({ success: true, donation: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
