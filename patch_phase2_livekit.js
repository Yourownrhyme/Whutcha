const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Replace the trackSubscribed block entirely
const oldTrackBlock = /room\.on\('trackSubscribed', \(track\) => \{[\s\S]*?\}\);\n    \}\n\};\n/m;

const newTrackBlock = `
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

        // PHANTOM DISCONNECT FIX: Viewer leaves gracefully or abruptly
        room.on('participantDisconnected', (participant) => {
            console.log('Viewer disconnected:', participant);
            showToast("Viewer left the Co-Stream");
            closeCoStreamModal();
        });
        
        room.on('disconnected', () => {
            console.log('Room disconnected');
            closeCoStreamModal();
        });
    }
};

let isDashboardMuted = false;
window.toggleDashboardAudio = function() {
    isDashboardMuted = !isDashboardMuted;
    const btn = document.getElementById('btn-dashboard-mute');
    const remoteVidContainer = document.getElementById('costream-remote-vid');
    if(!remoteVidContainer) return;
    
    const remoteVids = remoteVidContainer.getElementsByTagName('video');
    const remoteAudios = remoteVidContainer.getElementsByTagName('audio');
    
    [...remoteVids, ...remoteAudios].forEach(el => {
        el.muted = isDashboardMuted;
    });
    
    if (isDashboardMuted) {
        btn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span>Unmute Dashboard</span>';
    } else {
        btn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18l-6-6H4V6h2l6-6v18z"></path></svg><span>Mute Dashboard (Anti-Echo)</span>';
    }
};
`;

if(oldTrackBlock.test(js)) {
    js = js.replace(oldTrackBlock, newTrackBlock);
    fs.writeFileSync('whutcha-web/dashboard.js', js);
    console.log("Successfully patched LiveKit handlers.");
} else {
    console.log("Regex failed to match old block.");
}
