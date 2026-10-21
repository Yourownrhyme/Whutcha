const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Replace the entire window.approveDonation block
const oldApproveStart = js.indexOf('window.approveDonation = async');
const oldApproveEnd = js.indexOf('let isDashboardMuted = false;');
if (oldApproveStart !== -1 && oldApproveEnd !== -1) {
    const newApprove = `window.approveDonation = async (id, isCoStream, username) => {
    vibrate([50]);
    
    if (isCoStream) {
        document.getElementById('costream-modal').classList.remove('hidden');
        document.getElementById('costream-modal').classList.add('flex');
        document.getElementById('costream-remote-vid').innerHTML = '<div class="text-silver font-bold uppercase tracking-widest text-sm text-center px-4">Initializing Secure Room...</div>';
        
        try {
            const { data: edgeData, error: edgeError } = await supabaseClient.functions.invoke('livekit-token', {
                body: { roomName: id }
            });
            
            if (edgeError || !edgeData || !edgeData.streamerToken || !edgeData.viewerToken) {
                throw new Error("Edge Function failed to generate tokens");
            }
            
            // Push Viewer Token to DB so viewer.html can join, and set to approved
            const { error: dbError } = await supabaseClient.from('donations').update({ 
                status: 'approved',
                join_token: edgeData.viewerToken
            }).eq('id', id);
            
            if (dbError) throw dbError;
            
            const room = new LiveKitClient.Room();
            currentRoom = room; // Save globally for Drop Caller
            await room.connect('wss://whutcha-drgxd8d7.livekit.cloud', edgeData.streamerToken);
            await room.localParticipant.enableCameraAndMicrophone();
            
            room.localParticipant.on('localTrackPublished', (publication) => {
                if(publication.track && publication.track.kind === 'video') {
                    const vid = publication.track.attach();
                    vid.className = 'w-full h-full object-cover';
                    document.getElementById('costream-local-vid').innerHTML = '';
                    document.getElementById('costream-local-vid').appendChild(vid);
                }
            });

            room.on('trackSubscribed', (track) => {
                if (track.kind === 'video' || track.kind === 'audio') {
                    const element = track.attach();
                    // ANTI-ECHO ENFORCE
                    if (typeof isDashboardMuted !== 'undefined' && isDashboardMuted) {
                        element.muted = true;
                    }
                    
                    if (track.kind === 'video') {
                        element.className = 'w-full h-full object-cover';
                        document.getElementById('costream-remote-vid').innerHTML = '';
                        document.getElementById('costream-remote-vid').appendChild(element);
                    } else if (track.kind === 'audio') {
                        element.style.display = 'none';
                        document.getElementById('costream-remote-vid').appendChild(element);
                    }
                }
            });

            // PHANTOM DISCONNECT FIX
            room.on('participantDisconnected', (participant) => {
                showToast("Viewer left the Co-Stream");
                closeCoStreamModal();
            });
            
            room.on('disconnected', () => {
                closeCoStreamModal();
            });

        } catch (e) {
            console.error("CoStream Error:", e);
            alert("Failed to initialize Co-Stream: " + e.message);
            closeCoStreamModal();
        }
    } else {
        // Just a video message approval
        const { error } = await supabaseClient.from('donations').update({ status: 'approved' }).eq('id', id);
        if (error) alert("Network error: Could not approve.");
    }
};
\n`;
    
    js = js.substring(0, oldApproveStart) + newApprove + js.substring(oldApproveEnd);
    fs.writeFileSync('whutcha-web/dashboard.js', js);
    console.log("Successfully patched approveDonation logic.");
} else {
    console.log("Could not find approveDonation bounds.");
}
