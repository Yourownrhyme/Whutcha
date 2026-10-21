const fs = require('fs');

// --- 1. Patch dashboard.html ---
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Inject Notification Toggle and Keyboard hints into the Sidebar/Header
const notifHtml = `
            <div class="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5 mb-4 group cursor-pointer hover:border-primary/50 transition-colors" onclick="requestNotifications()">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-white uppercase tracking-wider" id="notif-status">Alerts OFF</p>
                    </div>
                </div>
            </div>
`;
html = html.replace(/<div class="flex md:flex-col items-center gap-2 md:space-y-4 md:gap-0 mt-4 md:mt-0 w-full md:w-auto">/, '<div class="flex md:flex-col items-center gap-2 md:space-y-4 md:gap-0 mt-4 md:mt-0 w-full md:w-auto">' + notifHtml);

// Inject Dashboard Audio Mute toggle into Co-Stream Modal
const muteHtml = `
                <button onclick="toggleDashboardAudio()" id="btn-dashboard-mute" class="bg-surface hover:bg-gray-700 text-silver hover:text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-colors border border-white/10 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18l-6-6H4V6h2l6-6v18z"></path></svg>
                    <span>Mute Dashboard (Anti-Echo)</span>
                </button>
`;
html = html.replace(/<button onclick="dropCaller\(\)"/, muteHtml + '\n                <button onclick="dropCaller()"');

fs.writeFileSync('whutcha-web/dashboard.html', html);


// --- 2. Patch dashboard.js ---
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// A. Notification Logic
const notifJs = `
// OS Notifications
let notificationsEnabled = false;

window.requestNotifications = async function() {
    vibrate([50]);
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        notificationsEnabled = true;
        const el = document.getElementById('notif-status');
        if(el) {
            el.innerText = "Alerts ON";
            el.classList.add('text-primary');
        }
        showToast("Background notifications enabled!");
    }
};

// Check on load
if ("Notification" in window && Notification.permission === "granted") {
    notificationsEnabled = true;
    setTimeout(() => {
        const el = document.getElementById('notif-status');
        if(el) { el.innerText = "Alerts ON"; el.classList.add('text-primary'); }
    }, 1000);
}
`;
js = js.replace(/function showToast/, notifJs + '\nfunction showToast');

// Hook notification into subscribeToQueue
const realtimeHook = `
function subscribeToQueue() {
    supabaseClient.channel('public:donations')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'donations',
            filter: \`streamer_id=eq.\${currentUser.id}\`
        }, (payload) => {
            console.log('Queue updated!', payload);
            
            // Trigger Notification for new pending donations
            if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                if (notificationsEnabled) {
                    const amount = parseFloat(payload.new.amount).toFixed(2);
                    new Notification("New Whutcha Donation!", {
                        body: \`\${payload.new.username} sent you $\${amount}\`,
                        icon: '/favicon.ico' // Ensure you have one
                    });
                }
                vibrate([100, 50, 100]); // Strong haptic for new incoming
            }
            
            loadQueue(); 
        })
        .subscribe();
}
`;
js = js.replace(/function subscribeToQueue\(\)[\s\S]*?\.subscribe\(\);\n\}/, realtimeHook);

// B. Anti-Echo Dashboard Mute
const muteJs = `
let isDashboardMuted = false;
window.toggleDashboardAudio = function() {
    isDashboardMuted = !isDashboardMuted;
    const btn = document.getElementById('btn-dashboard-mute');
    const remoteVidContainer = document.getElementById('costream-remote-vid');
    const remoteVids = remoteVidContainer.getElementsByTagName('video');
    const remoteAudios = remoteVidContainer.getElementsByTagName('audio');
    
    // Mute all remote elements
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

// Hook into trackSubscribed to enforce mute state on new tracks
const enforceMuteHook = `
        room.on('trackSubscribed', (track) => {
            if (track.kind === 'video' || track.kind === 'audio') {
                const element = track.attach();
                if (isDashboardMuted) element.muted = true; // ENFORCE MUTE STATE
                if(track.kind === 'video') {
                    element.className = 'w-full h-full object-cover';
                    document.getElementById('costream-remote-vid').innerHTML = '';
                    document.getElementById('costream-remote-vid').appendChild(element);
                } else if (track.kind === 'audio') {
                    // Hidden audio element needs to be appended somewhere or managed
                    element.style.display = 'none';
                    document.getElementById('costream-remote-vid').appendChild(element);
                }
            }
        });
`;

js = js.replace(/room\.on\('trackSubscribed', \(track\) => \{[\s\S]*?\}\);\n        \}\);/m, enforceMuteHook + '\n        });\n' + muteJs);

fs.writeFileSync('whutcha-web/dashboard.js', js);
