const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldJoinCoStream = /async function joinCoStream\(donationId\) \{[\s\S]*?\}/;

const newJoinCoStream = `async function joinCoStream(donationId) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('livekit-token', {
            body: { roomName: donationId }
        });
        
        if (error || !data) {
            console.error("Token error:", error);
            alert("Failed to get LiveKit tokens. Make sure the 'livekit-token' edge function is deployed and secrets are set.");
            return;
        }
        
        // 1. Give viewer their token by saving it to DB and setting approved
        await supabaseClient
            .from('donations')
            .update({ status: 'approved', join_token: data.viewerToken })
            .eq('id', donationId);
            
        // 2. Open Streamer Co-Stream Modal
        openCoStreamModal(data.streamerToken);
        
    } catch (e) {
        console.error('LiveKit error:', e);
        alert('Failed to connect to Co-Stream.');
    }
}

let activeCoStreamRoom = null;

async function openCoStreamModal(token) {
    const modal = document.getElementById('costream-modal');
    const localVideo = document.getElementById('costream-local-vid');
    const remoteVideo = document.getElementById('costream-remote-vid');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    try {
        activeCoStreamRoom = new LivekitClient.Room();
        
        activeCoStreamRoom.on('trackSubscribed', (track) => {
            if (track.kind === 'video') {
                const el = track.attach();
                el.className = 'w-full h-full object-cover';
                remoteVideo.innerHTML = '';
                remoteVideo.appendChild(el);
            }
            if (track.kind === 'audio') {
                track.attach();
            }
        });
        
        await activeCoStreamRoom.connect('wss://whutcha-drgxd8d7.livekit.cloud', token);
        
        // Publish Streamer's camera
        await activeCoStreamRoom.localParticipant.enableCameraAndMicrophone();
        
        const localPub = activeCoStreamRoom.localParticipant.videoTrackPublications.values().next().value;
        if (localPub && localPub.track) {
            const el = localPub.track.attach();
            el.className = 'w-full h-full object-cover';
            localVideo.innerHTML = '';
            localVideo.appendChild(el);
        }
        
    } catch (e) {
        alert("Failed to start LiveKit: " + e.message);
        closeCoStreamModal();
    }
}

function closeCoStreamModal() {
    if (activeCoStreamRoom) {
        activeCoStreamRoom.disconnect();
        activeCoStreamRoom = null;
    }
    const modal = document.getElementById('costream-modal');
    if(modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}`;

js = js.replace(oldJoinCoStream, newJoinCoStream);
fs.writeFileSync('whutcha-web/dashboard.js', js);
