const fs = require('fs');

// 1. Update Edge Function to return obsToken
let edgePath = 'supabase/functions/livekit-token/index.ts';
let edgeCode = fs.readFileSync(edgePath, 'utf8');

const oldTokens = `    const streamerToken = await generateToken("streamer_" + crypto.randomUUID().substring(0, 8), "Streamer");
    const viewerToken = await generateToken("viewer_" + crypto.randomUUID().substring(0, 8), "Viewer");

    return new Response(
      JSON.stringify({ streamerToken, viewerToken }),`;

const newTokens = `    const streamerToken = await generateToken("streamer_" + crypto.randomUUID().substring(0, 8), "Streamer");
    const viewerToken = await generateToken("viewer_" + crypto.randomUUID().substring(0, 8), "Viewer");
    const obsToken = await generateToken("obs_" + crypto.randomUUID().substring(0, 8), "OBS Overlay");

    return new Response(
      JSON.stringify({ streamerToken, viewerToken, obsToken }),`;

if(edgeCode.includes('stringify({ streamerToken, viewerToken })')) {
    edgeCode = edgeCode.replace(oldTokens, newTokens);
    fs.writeFileSync(edgePath, edgeCode);
    console.log("Edge function updated with obsToken.");
}

// 2. Update dashboard.js to save obsToken into video_hash
let dashboardPath = 'whutcha-web/dashboard.js';
let dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

const oldDashboardSave1 = `        // 1. Give viewer their token by saving it to DB and setting approved
        await supabaseClient
            .from('donations')
            .update({ status: 'approved', join_token: data.viewerToken })`;

const newDashboardSave1 = `        // 1. Give viewer their token by saving it to DB and setting approved
        await supabaseClient
            .from('donations')
            .update({ status: 'approved', join_token: data.viewerToken, video_hash: data.obsToken })`;

if(dashboardCode.includes("update({ status: 'approved', join_token: data.viewerToken })")) {
    dashboardCode = dashboardCode.replace(oldDashboardSave1, newDashboardSave1);
}

const oldDashboardSave2 = `            // Push Viewer Token to DB so viewer.html can join, and set to approved
            const { error: dbError } = await supabaseClient.from('donations').update({ 
                status: 'approved',
                join_token: edgeData.viewerToken
            }).eq('id', id);`;

const newDashboardSave2 = `            // Push Viewer Token to DB so viewer.html can join, and set to approved
            const { error: dbError } = await supabaseClient.from('donations').update({ 
                status: 'approved',
                join_token: edgeData.viewerToken,
                video_hash: edgeData.obsToken
            }).eq('id', id);`;

if(dashboardCode.includes("join_token: edgeData.viewerToken\n            }).eq('id', id);")) {
    dashboardCode = dashboardCode.replace(oldDashboardSave2, newDashboardSave2);
}

fs.writeFileSync(dashboardPath, dashboardCode);
console.log("Dashboard updated to save obsToken to video_hash.");


// 3. Update overlay.html to connect with video_hash
let overlayPath = 'whutcha-web/overlay.html';
let overlayCode = fs.readFileSync(overlayPath, 'utf8');

const oldOverlayCheck = `            if (isCoStream) {
                if (donation.join_token) {
                    await connectCoStream(donation.join_token);
                } else {`;

const newOverlayCheck = `            if (isCoStream) {
                if (donation.video_hash && donation.video_hash !== 'costream_request') {
                    // STRYKER DOCTRINE FIX: Use the specific OBS token stored in video_hash
                    // to prevent LiveKit participant identity collision with the viewer!
                    await connectCoStream(donation.video_hash);
                } else {`;

if (overlayCode.includes("await connectCoStream(donation.join_token);")) {
    overlayCode = overlayCode.replace(oldOverlayCheck, newOverlayCheck);
    fs.writeFileSync(overlayPath, overlayCode);
    console.log("Overlay updated to connect using video_hash (OBS Token).");
}

