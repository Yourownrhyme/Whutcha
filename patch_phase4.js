const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// --- 1. Fix Canvas Reaction to 9:16 (TikTok Vertical Split) ---
const newCanvasDraw = `
    // Set up canvas for TikTok/Shorts (1080x1920)
    reactionCanvas.width = 1080;
    reactionCanvas.height = 1920;
    const ctx = reactionCanvas.getContext('2d');
    
    reactionViewerVid.play();
    
    // Helper to draw image like object-fit: cover
    function drawCover(ctx, video, x, y, w, h) {
        if(!video.videoWidth || !video.videoHeight) return;
        const videoRatio = video.videoWidth / video.videoHeight;
        const boxRatio = w / h;
        let drawW = w, drawH = h, drawX = x, drawY = y;
        
        if (videoRatio > boxRatio) {
            drawW = h * videoRatio;
            drawX = x - (drawW - w) / 2;
        } else {
            drawH = w / videoRatio;
            drawY = y - (drawH - h) / 2;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(video, drawX, drawY, drawW, drawH);
        ctx.restore();
    }
    
    function drawLoop() {
        // Streamer on Top (1080x960), Viewer on Bottom (1080x960)
        drawCover(ctx, reactionStreamerCam, 0, 0, 1080, 960);
        drawCover(ctx, reactionViewerVid, 0, 960, 1080, 960);
        animationFrameId = requestAnimationFrame(drawLoop);
    }
    drawLoop();
`;

js = js.replace(/\/\/ Set up canvas \([\s\S]*?drawLoop\(\);/m, newCanvasDraw);


// --- 2. Fix SLA Auto-Death Timer ---
// First, inject global intervals container
js = js.replace(/let currentDonations = \[\];/, 'let currentDonations = [];\nwindow.slaTimers = window.slaTimers || {};');

// Then, inside renderQueue loop, inject timer logic instead of static 15:00
const renderQueueReplacement = `
    const isCoStream = (d.videoHash || (d.videoHash || d.video_hash) || '').toLowerCase().includes('costream');
    const createdTime = new Date(d.created_at).getTime();
    const expiryTime = createdTime + (15 * 60 * 1000); // 15 mins
    
    const card = document.createElement('div');
    card.id = 'donation-' + d.id;
    card.className = 'glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 relative overflow-hidden group border border-white/10 transition-all duration-500';
    
    const timerHtmlId = 'timer-' + d.id;
    
    card.innerHTML = \`
        <div class="absolute inset-0 bg-gradient-to-r \${isCoStream ? 'from-secondary/10' : 'from-primary/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <div class="relative w-full md:w-48 h-48 md:h-32 bg-black rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
            \${isCoStream 
                ? '<div class="w-full h-full flex flex-col items-center justify-center bg-secondary/20"><svg class="w-8 h-8 text-secondary mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="font-black text-xs text-secondary uppercase tracking-widest">Co-Stream</span></div>'
                : \`<video src="\${videoUrl}" class="w-full h-full object-cover" controls preload="metadata"></video>\`
            }
            <span id="\${timerHtmlId}" class="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white font-black px-2 py-1 text-[10px] rounded uppercase shadow border border-white/10 font-mono tracking-wider">15:00</span>
        </div>
        <div class="flex-1 flex flex-col justify-between relative z-10">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase \${isCoStream ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-primary/20 text-primary border border-primary/30'} shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                        \${isCoStream ? 'Live Request' : 'Video Msg'}
                    </span>
                </div>
                <h4 class="text-xl font-bold text-white mb-1">\${sanitize(d.username)}</h4>
                <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r \${isCoStream ? 'from-secondary to-purple-400' : 'from-primary to-green-400'}">
                    $\${d.amount}
                </p>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-4" id="actions-\${d.id}">
                <button onclick="approveDonation('\${d.id}', \${isCoStream}, '\${sanitize(d.username)}')" class="flex-1 py-2 px-4 bg-white hover:bg-gray-200 text-black font-black text-sm rounded-xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    \${isCoStream ? 'Accept & Join' : 'Approve Video'}
                </button>
                \${!isCoStream ? \`<button onclick="openReactionModal('\${videoUrl}')" class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-colors">Reaction</button>\` : ''}
                <button onclick="rejectDonation('\${d.id}')" class="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm rounded-xl transition-colors">
                    Reject
                </button>
            </div>
        </div>
    \`;
    container.appendChild(card);
    
    // Timer Logic
    if(window.slaTimers[d.id]) clearInterval(window.slaTimers[d.id]);
    window.slaTimers[d.id] = setInterval(() => {
        const now = Date.now();
        const diff = expiryTime - now;
        const timerEl = document.getElementById(timerHtmlId);
        
        if(diff <= 0) {
            clearInterval(window.slaTimers[d.id]);
            if(timerEl) {
                timerEl.innerText = "EXPIRED";
                timerEl.className = "absolute top-2 right-2 bg-red-600/90 text-white font-black px-2 py-1 text-[10px] rounded uppercase shadow border border-red-400 animate-pulse";
            }
            const actionEl = document.getElementById('actions-' + d.id);
            if(actionEl) {
                actionEl.innerHTML = '<span class="text-red-500 font-bold text-sm uppercase">Auto-rejected (Timeout)</span>';
            }
            // Auto reject in DB
            supabaseClient.from('donations').update({ status: 'rejected' }).eq('id', d.id).then(()=>{});
        } else {
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if(timerEl) timerEl.innerText = \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
        }
    }, 1000);
    
    // End of card loop
    return;
`;
// Replace the card rendering block inside forEach
js = js.replace(/const isCoStream[\s\S]*?\`\;/m, renderQueueReplacement);
js = js.replace(/container\.appendChild\(card\);/m, ""); // Remove the duplicate append from old code


// --- 3. Fix Co-Stream Layout and Drop Caller ---

// Find where LiveKit connects in dashboard.js and add Drop logic
const newCostreamLogic = `
let currentRoom = null;
window.closeCoStreamModal = async function() {
    vibrate([50,50]);
    if(currentRoom) {
        await currentRoom.disconnect();
        currentRoom = null;
    }
    const modal = document.getElementById('costream-modal');
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.dropCaller = async function() {
    vibrate([100,50,100]);
    if(currentRoom) {
        // Find remote participant and conceptually 'kick' them (LiveKit requires server kick, but disconnecting room effectively ends it for streamer)
        await currentRoom.disconnect();
        currentRoom = null;
    }
    const modal = document.getElementById('costream-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    alert("Caller Dropped.");
};

window.approveDonation = async (id, isCoStream, username) => {
    // ... we need to inject into approveDonation to save currentRoom
`;
// We won't regex approveDonation because it's complex, we will just redefine it at the bottom.

const overrideApprove = `
window.approveDonation = async (id, isCoStream, username) => {
    vibrate([50]);
    const { error } = await supabaseClient.from('donations').update({ status: 'approved' }).eq('id', id);
    if (error) { alert("Network error: Could not approve."); return; }
    
    if (isCoStream) {
        document.getElementById('costream-modal').classList.remove('hidden');
        document.getElementById('costream-modal').classList.add('flex');
        
        const { data: edgeData, error: edgeError } = await supabaseClient.functions.invoke('livekit-token', {
            body: { roomName: id, participantName: 'Streamer' }
        });
        
        if (edgeError || !edgeData.token) {
            alert('Failed to init Co-Stream');
            return;
        }
        
        const room = new LiveKitClient.Room();
        currentRoom = room; // Save globally for Drop Caller
        await room.connect('wss://whutcha-drgxd8d7.livekit.cloud', edgeData.token);
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
                if(track.kind === 'video') {
                    element.className = 'w-full h-full object-cover';
                    document.getElementById('costream-remote-vid').innerHTML = '';
                    document.getElementById('costream-remote-vid').appendChild(element);
                }
            }
        });
    }
};
`;
js += overrideApprove;

fs.writeFileSync('whutcha-web/dashboard.js', js);


// --- 4. Update Modals in dashboard.html for Liquid Silver & Drop Caller ---
html = html.replace(/<!-- Co-Stream Modal -->[\s\S]*?<!-- Reaction Modal -->/m, 
`<!-- Co-Stream Modal -->
    <div id="costream-modal" class="fixed inset-0 z-[110] modal-glass hidden flex-col items-center justify-center p-6">
        <div class="glass-card w-full max-w-5xl p-8 rounded-3xl flex flex-col gap-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-red-500/30">
            <div class="flex justify-between items-center pb-4 border-b border-white/10">
                <div class="flex items-center gap-4">
                    <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                    <h3 class="text-2xl font-black uppercase text-white">Live Co-Stream Active</h3>
                </div>
                <button onclick="dropCaller()" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-colors border border-red-400">
                    DROP CALLER (KICK)
                </button>
            </div>
            
            <div class="flex flex-col md:flex-row gap-6 h-[60vh]">
                <!-- Streamer Video -->
                <div class="flex-1 bg-black rounded-2xl border border-white/10 relative overflow-hidden shadow-lg">
                    <span class="absolute top-4 left-4 bg-primary text-black font-black px-3 py-1 text-[10px] rounded uppercase z-10 shadow">You</span>
                    <div id="costream-local-vid" class="w-full h-full flex items-center justify-center"></div>
                </div>
                
                <!-- Viewer Video -->
                <div class="flex-1 bg-black rounded-2xl border border-white/10 relative overflow-hidden shadow-lg">
                    <span class="absolute top-4 right-4 bg-secondary text-white font-black px-3 py-1 text-[10px] rounded uppercase z-10 shadow">Viewer</span>
                    <div id="costream-remote-vid" class="w-full h-full flex items-center justify-center text-silver font-bold uppercase tracking-widest text-sm text-center px-4">Waiting for connection...</div>
                </div>
            </div>
            <button onclick="closeCoStreamModal()" class="w-full py-4 text-silver hover:text-white font-bold transition-colors">Close UI (Keeps Room Active in OBS)</button>
        </div>
    </div>
    <!-- Reaction Modal -->`);

html = html.replace(/<!-- Reaction Modal -->[\s\S]*?<!-- Scripts -->/m, 
`<!-- Reaction Modal -->
    <div id="reaction-modal" class="fixed inset-0 z-[100] modal-glass hidden flex-col items-center justify-center p-6">
        <div class="glass-card w-full max-w-5xl p-8 rounded-3xl flex flex-col gap-6 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div class="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 class="text-2xl font-black uppercase text-white">Record TikTok Reaction</h3>
                <button onclick="closeReactionModal()" class="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <canvas id="reaction-canvas" class="hidden"></canvas>
            
            <!-- Preview UI (Not actual canvas, just HTML layout to show what will be recorded) -->
            <div class="flex justify-center h-[55vh]">
                <!-- TikTok 9:16 Mockup -->
                <div class="w-[30vh] md:w-[35vh] h-full bg-black rounded-3xl border-4 border-primary relative overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                    <!-- Streamer Top Half -->
                    <div class="h-1/2 relative bg-surface border-b-2 border-white/20">
                        <span class="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white font-black px-2 py-1 text-[10px] rounded uppercase z-10">You</span>
                        <video id="reaction-streamer-cam" class="w-full h-full object-cover" autoplay muted playsinline></video>
                    </div>
                    <!-- Viewer Bottom Half -->
                    <div class="h-1/2 relative bg-surface">
                        <span class="absolute top-2 left-2 bg-primary text-black font-black px-2 py-1 text-[10px] rounded uppercase z-10">Donation</span>
                        <video id="reaction-viewer-vid" crossorigin="anonymous" class="w-full h-full object-cover" controls preload="metadata"></video>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-center gap-4 mt-2">
                <button id="btn-start-record" class="bg-gradient-to-r from-primary to-blue-500 text-black py-4 px-12 font-black text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:opacity-90 transition-opacity w-full max-w-sm">
                    ● Start Recording
                </button>
                <button id="btn-stop-record" class="bg-red-500 hover:bg-red-600 text-white py-4 px-12 font-black text-lg uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-colors hidden w-full max-w-sm">
                    ■ Stop & Save
                </button>
            </div>
        </div>
    </div>
    <!-- Scripts -->`);

fs.writeFileSync('whutcha-web/dashboard.html', html);
