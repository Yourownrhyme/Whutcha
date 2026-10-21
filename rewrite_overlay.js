const fs = require('fs');

const overlayHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Whutcha OBS Overlay</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit.umd.min.js"></script>
    
    <style>
        body {
            background-color: transparent; /* Must be transparent for OBS */
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: flex-end; /* Usually better at bottom or center, let's do center */
            justify-content: center;
            font-family: 'Inter', sans-serif;
            overflow: hidden;
        }

        #widget-container {
            width: 1280px; /* Standard 720p box for 1080p canvas */
            background: rgba(15, 17, 26, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 240, 255, 0.5);
            border-radius: 30px;
            box-shadow: 0 0 50px rgba(0, 240, 255, 0.3);
            display: none;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .widget-show {
            display: flex !important;
            opacity: 1 !important;
            transform: scale(1) !important;
        }

        #media-container {
            width: 100%;
            height: 720px;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        video {
            width: 100%;
            height: 100%;
            object-fit: cover; /* Cover looks premium */
        }
    </style>
</head>
<body>

    <div id="widget-container">
        <!-- Header -->
        <div class="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex justify-between items-center border-b border-white/10">
            <div class="flex items-center gap-6">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                    <span id="donor-initial">?</span>
                </div>
                <div>
                    <h2 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span id="donor-name">Viewer</span>
                        <span class="text-sm px-3 py-1 bg-white/10 rounded-full text-gray-300 font-bold" id="donation-type">Video Message</span>
                    </h2>
                </div>
            </div>
            <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-8 py-3 rounded-2xl border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <span id="donor-amount" class="text-4xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">+$0.00</span>
            </div>
        </div>

        <!-- Video/LiveKit Space -->
        <div id="media-container"></div>
    </div>

    <script>
        const supabaseUrl = 'https://kjoffilncbybquvjytxx.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        const widgetContainer = document.getElementById('widget-container');
        const mediaContainer = document.getElementById('media-container');
        
        let currentRoom = null; 
        
        // --- QUEUE SYSTEM ---
        const alertQueue = [];
        let isPlaying = false;

        // Clean synth chime (Base64 to avoid external CDN dependency failures)
        const chimeAudio = new Audio('data:audio/wav;base64,UklGRmQEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSAEAABp/2L/Qv8n/xH/BP/+/uX+y/6r/pj+gv5v/mL+WP5Q/kn+RP5B/kL+RP5I/kz+Uv5Y/mD+av51/oP+jv6b/qb+sv68/sb+0f7b/ub+7/74/gD/CP8R/xr/J/8y/z3/Sf9T/17/af91/4H/i/+V/6D/qv+0/73/xv/P/9j/4f/q//P//P8EAA0AFAAcACUAKwA0ADkAQABHAFAAWQBkAG8AeQCEAIsAkQCVAJsAnQChAKIAogCjAKQApACiAKAAngCZAJQAkACIAIQAdwBsAGEAVgBKAEAAOQAwACcAHgAVAA0ABgD+//j/7P/j/9n/0P/F/73/sv+o/5z/kP+F/3n/bv9m/1//WP9T/0//Tf9K/0f/R/9G/0b/Rv9J/0z/Tv9T/1j/Xf9k/2v/cv96/4P/jP+T/5z/o/+r/7P/vP/E/83/1v/e/+b/7v/2//7/BgAQAxkD');

        async function processQueue() {
            if (isPlaying || alertQueue.length === 0) return;
            
            isPlaying = true;
            const donation = alertQueue.shift();
            
            document.getElementById('donor-name').innerText = donation.username;
            document.getElementById('donor-initial').innerText = donation.username.charAt(0).toUpperCase();
            document.getElementById('donor-amount').innerText = \`+$\${parseFloat(donation.amount).toFixed(2)}\`;
            
            const isCoStream = (donation.videoHash || donation.video_hash || '').toLowerCase().includes("costream");
            document.getElementById('donation-type').innerText = isCoStream ? "Live Co-Stream" : "Video Message";

            widgetContainer.classList.add('widget-show');
            
            chimeAudio.volume = 0.5;
            chimeAudio.play().catch(e => console.log("Sound autoplay blocked by OBS"));

            if (isCoStream) {
                if (donation.join_token) {
                    await connectCoStream(donation.join_token);
                } else {
                    hideWidget(); // Failsafe
                }
            } else {
                playVideoMessage(donation.videoHash || donation.video_hash);
            }
        }

        function hideWidget() {
            widgetContainer.classList.remove('widget-show');
            setTimeout(() => {
                mediaContainer.innerHTML = ''; 
                if (currentRoom) {
                    currentRoom.disconnect();
                    currentRoom = null;
                }
                isPlaying = false;
                processQueue(); // Process next in line
            }, 600); // Wait for transition
        }

        function playVideoMessage(videoHash) {
            mediaContainer.innerHTML = ''; 
            // Add cache buster to prevent XSS/stale video attacks
            const videoUrl = \`\${supabaseUrl}/storage/v1/object/public/videos/\${videoHash}?t=\${Date.now()}\`;
            
            const videoEl = document.createElement('video');
            videoEl.src = videoUrl;
            videoEl.autoplay = true;
            videoEl.controls = false;
            
            videoEl.onended = () => { hideWidget(); };
            videoEl.onerror = () => { console.error("OBS: Video failed to play"); hideWidget(); };
            
            mediaContainer.appendChild(videoEl);
        }

        async function connectCoStream(token) {
            mediaContainer.innerHTML = '<div class="text-white text-xl animate-pulse font-bold tracking-widest uppercase">Connecting to viewer via WebRTC...</div>';
            
            try {
                currentRoom = new LiveKitClient.Room();
                
                // IMPORTANT: We do NOT enable camera/mic here. Overlay is viewer-only.
                
                currentRoom.on('trackSubscribed', (track) => {
                    if (track.kind === 'video' || track.kind === 'audio') {
                        const element = track.attach();
                        if(track.kind === 'video') {
                            mediaContainer.innerHTML = ''; 
                            element.className = "w-full h-full object-cover";
                            mediaContainer.appendChild(element);
                        }
                    }
                });

                // If Streamer clicks "Drop Caller" in dashboard, room dies, this triggers!
                currentRoom.on('disconnected', () => {
                    hideWidget();
                });

                await currentRoom.connect('wss://whutcha-drgxd8d7.livekit.cloud', token);
                
                // Note: No setTimeout(hideWidget, 60000) here anymore! 
                // The stream lasts as long as the streamer wants.

            } catch (error) {
                console.error("LiveKit connection error:", error);
                mediaContainer.innerHTML = '<div class="text-red-500 text-xl font-bold uppercase">Connection Failed</div>';
                setTimeout(hideWidget, 3000);
            }
        }

        function startListening() {
            const urlParams = new URLSearchParams(window.location.search);
            const streamerId = urlParams.get('streamer');
            if(!streamerId || streamerId === 'default') {
                console.error("OBS: Invalid streamer ID");
                return;
            }
            
            console.log(\`OBS Overlay active for: \${streamerId}\`);
            
            supabase
                .channel('obs-overlay')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'donations',
                    filter: \`streamer_id=eq.\${streamerId}\` 
                }, payload => {
                    const donation = payload.new;
                    if (donation.status !== 'approved') return;
                    
                    // Push to queue and process
                    alertQueue.push(donation);
                    processQueue();
                })
                .subscribe();
        }

        startListening();
    </script>
</body>
</html>`;

fs.writeFileSync('whutcha-web/overlay.html', overlayHTML);
