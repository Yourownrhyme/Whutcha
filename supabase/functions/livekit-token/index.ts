import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomName } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    
    // We would ideally verify the JWT with Supabase here, but as a quick edge check, 
    // we use the Supabase client to get the user
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized request' }), { status: 401, headers: corsHeaders });
    }
    
    // Check if user is the streamer for this room (Optional but recommended)
    // if (roomName !== user.id && !roomName.includes(user.id)) { ... }


    if (!roomName) {
      throw new Error("Missing roomName parameter");
    }

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error("Whutcha Live Bridge credentials not configured on the server");
    }

    const secret = new TextEncoder().encode(apiSecret);
    const alg = 'HS256';

    const generateToken = async (participantId: string, participantName: string) => {
      return await new jose.SignJWT({
        name: participantName,
        video: {
          roomJoin: true,
          room: roomName,
          canPublish: true,
          canSubscribe: true,
        }
      })
        .setProtectedHeader({ alg })
        .setIssuer(apiKey)
        .setSubject(participantId)
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
    };

    const streamerToken = await generateToken("streamer_" + crypto.randomUUID().substring(0, 8), "Streamer");
    const viewerToken = await generateToken("viewer_" + crypto.randomUUID().substring(0, 8), "Viewer");
    const obsToken = await generateToken("obs_" + crypto.randomUUID().substring(0, 8), "OBS Overlay");

    return new Response(
      JSON.stringify({ streamerToken, viewerToken, obsToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
