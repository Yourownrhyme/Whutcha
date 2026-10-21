const fs = require('fs');
let html = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

// 1. Remove the old basic video CSS
html = html.replace(/video \{[\s\S]*?object-fit: cover; \/\* Cover looks premium \*\/\n        \}/, 
`video.cinematic-bg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: blur(25px) brightness(0.4);
            transform: scale(1.1);
            position: absolute;
            z-index: 0;
        }
        video.cinematic-fg {
            width: 100%;
            height: 100%;
            object-fit: contain;
            position: absolute;
            z-index: 10;
            filter: drop-shadow(0 0 30px rgba(0,0,0,0.8));
        }`);

// 2. Rewrite playVideoMessage to use dual videos
const newPlayVideo = `
        function playVideoMessage(videoHash) {
            mediaContainer.innerHTML = ''; 
            const videoUrl = \`\${supabaseUrl}/storage/v1/object/public/videos/\${videoHash}?t=\${Date.now()}\`;
            
            // Background Blurred Video
            const bgVideo = document.createElement('video');
            bgVideo.src = videoUrl;
            bgVideo.autoplay = true;
            bgVideo.muted = true; // Muted so we don't play audio twice
            bgVideo.className = 'cinematic-bg';
            
            // Foreground Clear Video
            const fgVideo = document.createElement('video');
            fgVideo.src = videoUrl;
            fgVideo.autoplay = true;
            fgVideo.className = 'cinematic-fg';
            
            fgVideo.onended = () => { hideWidget(); };
            fgVideo.onerror = () => { console.error("OBS: Video failed to play"); hideWidget(); };
            
            mediaContainer.appendChild(bgVideo);
            mediaContainer.appendChild(fgVideo);
        }
`;
html = html.replace(/function playVideoMessage\(videoHash\) \{[\s\S]*?mediaContainer\.appendChild\(videoEl\);\n        \}/, newPlayVideo);

// 3. Rewrite connectCoStream trackSubscribed to use dual LiveKit attachments
const newLiveKitSub = `
                currentRoom.on('trackSubscribed', (track) => {
                    if (track.kind === 'video') {
                        mediaContainer.innerHTML = ''; 
                        
                        // Background Blurred Live Video
                        const bgEl = track.attach();
                        bgEl.className = 'cinematic-bg';
                        
                        // Foreground Clear Live Video
                        const fgEl = track.attach();
                        fgEl.className = 'cinematic-fg';
                        
                        mediaContainer.appendChild(bgEl);
                        mediaContainer.appendChild(fgEl);
                    } else if (track.kind === 'audio') {
                        const audioEl = track.attach();
                        audioEl.style.display = 'none';
                        mediaContainer.appendChild(audioEl);
                    }
                });
`;
html = html.replace(/currentRoom\.on\('trackSubscribed', \(track\) => \{[\s\S]*?\}\);\n                \}\);/, newLiveKitSub);

fs.writeFileSync('whutcha-web/overlay.html', html);
