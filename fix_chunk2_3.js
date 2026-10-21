const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const newFunctions = `
        // ==========================================
        // LIVEKIT VIEWER LOGIC (CHUNK 2)
        // ==========================================
        let realtimeChannel = null;
        
        function subscribeToCoStreamApproval(donationId) {
            console.log("Subscribing to approval for", donationId);
            realtimeChannel = supabase
                .channel('viewer-costream-' + donationId)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'donations',
                    filter: 'id=eq.' + donationId
                }, async (payload) => {
                    const row = payload.new;
                    if (row.status === 'approved' && row.join_token) {
                        console.log("STREAMER APPROVED! Token received.");
                        document.getElementById('costream-status-text').innerText = "CONNECTING TO LIVE ROOM...";
                        document.getElementById('costream-status-text').classList.remove('animate-pulse');
                        document.getElementById('costream-status-text').classList.add('text-green-400');
                        
                        // Clean up realtime listener
                        supabase.removeChannel(realtimeChannel);
                        
                        await connectCoStreamRoom(row.join_token);
                    }
                })
                .subscribe();
        }

        async function connectCoStreamRoom(token) {
            try {
                viewerRoom = new LiveKitClient.Room();
                
                // Disconnect handler (if Streamer drops us)
                viewerRoom.on('disconnected', () => {
                    alert("The Streamer ended the Co-stream.");
                    window.location.reload();
                });

                await viewerRoom.connect('wss://whutcha-drgxd8d7.livekit.cloud', token);
                console.log("Connected to LiveKit as Viewer");
                
                document.getElementById('costream-status-text').innerText = "YOU ARE LIVE!";
                
                // VAMPIRE MODE: Activate hardware ONLY upon connection
                await viewerRoom.localParticipant.enableCameraAndMicrophone();
                
                // Render our camera in the local container
                viewerRoom.localParticipant.on('localTrackPublished', (publication) => {
                    if (publication.track.kind === 'video') {
                        const vidEl = publication.track.attach();
                        vidEl.className = "w-full h-full object-cover scale-x-[-1]";
                        const container = document.getElementById('local-costream-video');
                        container.innerHTML = '';
                        container.appendChild(vidEl);
                    }
                });

            } catch (err) {
                console.error("LiveKit connection error:", err);
                alert("Failed to connect to the live room: " + err.message);
                window.location.reload();
            }
        }

        // Cancel button logic
        document.getElementById('cancel-costream-btn').addEventListener('click', () => {
            if (viewerRoom) {
                if (viewerRoom.localParticipant) {
                    viewerRoom.localParticipant.setCameraEnabled(false);
                    viewerRoom.localParticipant.setMicrophoneEnabled(false);
                }
                viewerRoom.disconnect();
            }
            if (realtimeChannel) supabase.removeChannel(realtimeChannel);
            window.location.reload();
        });
        
    </script>
</body>
</html>`;

html = html.replace(/<\/script>\s*<\/body>\s*<\/html>/, newFunctions);
fs.writeFileSync('whutcha-web/viewer.html', html);
console.log("Chunk 2.3 logic injected.");
