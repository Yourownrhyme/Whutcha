const fs = require('fs');

// 1. Fix livekit-token auth bypass
let livekitIndex = fs.readFileSync('supabase/functions/livekit-token/index.ts', 'utf8');

const authCheck = `
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
`;

if (!livekitIndex.includes('auth.getUser()')) {
    livekitIndex = livekitIndex.replace('const { roomName } = await req.json();', `const { roomName } = await req.json();\n${authCheck}`);
    fs.writeFileSync('supabase/functions/livekit-token/index.ts', livekitIndex);
    console.log("Fixed livekit-token");
}

// 2. Fix create-donation IP pass-through for Skynet Rate Limit
let createDonation = fs.readFileSync('supabase/functions/create-donation/index.ts', 'utf8');

const ipFix = `
    // FIX: Pass the true client IP so Skynet Rate Limit DB trigger works!
    // Since we are using service_role, we MUST pass the origin IP via a custom header or explicitly in the payload.
    // Instead of doing it via headers (which PostgREST might ignore for service_role), we should pass it to the DB or verify here.
    
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Quick Edge-level Skynet implementation (if DB trigger fails due to unknown)
    // We just pass it in the insert so the DB trigger can read it.
    // Wait, the DB trigger reads 'request.headers'. We can set it in the supabase client!
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
    );
`;

if (createDonation.includes('const supabaseClient = createClient')) {
    createDonation = createDonation.replace(/const supabaseClient = createClient\([\s\S]*?\)/, ipFix);
    fs.writeFileSync('supabase/functions/create-donation/index.ts', createDonation);
    console.log("Fixed create-donation Skynet bypass");
}
