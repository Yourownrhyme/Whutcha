        const supabaseUrl = 'https://kjoffilncbybquvjytxx.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

        document.addEventListener("DOMContentLoaded", async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const streamerId = urlParams.get('streamer');
            
            if (!streamerId || streamerId === 'default') {
                document.body.innerHTML = '<div class="flex min-h-screen items-center justify-center"><div class="glass-card p-8 rounded-3xl text-center"><h2 class="text-2xl font-black text-red-400 mb-2">Invalid Link</h2><p class="text-silver text-sm">Please ask the streamer for a valid URL.</p></div></div>';
                return;
            }
            
            // Fetch Streamer Info
            const { data: profile, error: profileError } = await supabase.from('profiles').select('username, avatar_url, min_video_price, min_costream_price').eq('id', streamerId).single();
            if (profileError || !profile) {
                document.body.innerHTML = '<div class="flex min-h-screen bg-background items-center justify-center p-6"><div class="glass-card w-full max-w-sm p-8 rounded-3xl text-center border-red-500/30 border shadow-[0_0_50px_rgba(239,68,68,0.2)]"><div class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><h2 class="text-2xl font-black text-white mb-2">Streamer Not Found</h2><p class="text-silver text-sm">This link is invalid or the streamer deleted their account.</p></div></div>';
                return;
            }
            
            if(profile) {
                document.getElementById('streamer-name').innerText = profile.username || 'Streamer';
                document.getElementById('streamer-avatar').innerText = (profile.username || 'S').charAt(0).toUpperCase();
                document.title = "Donate to " + (profile.username || 'Streamer');
                
                if (profile.min_video_price) minVideoPrice = parseFloat(profile.min_video_price);
                if (profile.min_costream_price) minCostreamPrice = parseFloat(profile.min_costream_price);
                
                currentMinPrice = minVideoPrice;
                const amountInput = document.getElementById('amount');
                if (amountInput) amountInput.value = currentMinPrice.toFixed(2);
                updatePresets();
            }

            document.getElementById('main-form-ui').classList.remove('hidden');

            const amountInput = document.getElementById('amount');
            const submitBtn = document.getElementById('submit-btn');
            
            
            function updatePresets() {
                const container = document.getElementById('preset-buttons-container');
                if(!container) return;
                const multipliers = [1, 2, 5, 10];
                container.innerHTML = '';
                multipliers.forEach(m => {
                    const val = currentMinPrice * m;
                    const btn = document.createElement('button');
                    btn.className = "preset-btn py-2 rounded-xl font-black text-sm";
                    btn.innerText = "$" + val;
                    btn.onclick = () => window.setAmount(val);
                    container.appendChild(btn);
                });
            }

            window.setAmount = function(val) {
                vibrate([30]);
                amountInput.value = val;
                updateSubmitBtn();
            };

            amountInput.addEventListener('input', updateSubmitBtn);
            
            function updateSubmitBtn() {
                const val = parseFloat(amountInput.value) || 0;
                submitBtn.innerText = `SEND FOR $${val.toFixed(2)}`;
            }

            // Logic for Camera...
            const btnAllowCamera = document.getElementById('btn-allow-camera');
            btnAllowCamera.addEventListener('click', () => {
                vibrate([50]);
                document.getElementById('camera-overlay').style.display = 'none';
                startRecording();
            });

            // Tabs
            let currentTab = 'video';
            const tabVideo = document.getElementById('tab-video');
            const tabCostream = document.getElementById('tab-costream');
            const videoSection = document.getElementById('video-section');
            const costreamSection = document.getElementById('costream-section');
            const mediaLabel = document.getElementById('media-label');

            tabVideo.addEventListener('click', () => {
                vibrate([20]);
                currentTab = 'video';
                tabVideo.className = 'flex-1 py-3 text-sm font-black rounded-xl bg-primary text-black shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all';
                tabCostream.className = 'flex-1 py-3 text-sm font-black rounded-xl text-silver hover:text-white transition-all';
                videoSection.classList.remove('hidden');
                costreamSection.classList.add('hidden');
                mediaLabel.innerText = 'Record Video';
                if(!finalVideoBlob) startRecording();
            });

            tabCostream.addEventListener('click', () => {
                vibrate([20]);
                currentTab = 'costream';
                tabCostream.className = 'flex-1 py-3 text-sm font-black rounded-xl bg-secondary text-white shadow-[0_0_15px_rgba(157,0,255,0.4)] transition-all';
                tabVideo.className = 'flex-1 py-3 text-sm font-black rounded-xl text-silver hover:text-white transition-all';
                costreamSection.classList.remove('hidden');
                videoSection.classList.add('hidden');
                mediaLabel.innerText = 'Co-Stream Request';
                stopCamera();
            });

            // Video Recording Logic
            let stream = null;
            let mediaRecorder = null;
            let recordedChunks = [];
            let finalVideoBlob = null;
            let recordingTimer = null;
            let recordingSeconds = 0;
            const maxDuration = 30; // seconds

            const videoElement = document.getElementById('camera-feed');
            const videoPreview = document.getElementById('video-preview');
            const videoPreviewWrapper = document.getElementById('video-preview-wrapper');
            const recordBtn = document.getElementById('record-btn');
            const recordBtnContainer = document.getElementById('record-btn-container');
            const timerDisplay = document.getElementById('timer-display');
            const retakeBtn = document.getElementById('retake-btn');

            async function startRecording() {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                    videoElement.srcObject = stream;
                    document.getElementById('camera-error').classList.add('hidden');
                                } catch (err) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '0%';
                    alert("Error: " + err.message);
                    btnText.innerText = `SEND FOR ${amount.toFixed(2)}`;
                    submitBtn.disabled = false;
                }
                        }, 2500);
                    }
                } catch (err) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '0%';
                    alert("Error: " + err.message);
                    btnText.innerText = `SEND FOR ${amount.toFixed(2)}`;
                    submitBtn.disabled = false;
                }

                    }
                } catch (err) {
                    alert("Error: " + err.message);
                    submitBtn.innerText = `SEND FOR $${amount.toFixed(2)}`;
                    submitBtn.disabled = false;
                }
            });
            
            // Co-Stream Handlers
            let currentRoom = null;
            
            
            window.approvalChannel = null;
            window.cancelCoStream = function() {
                vibrate([50]);
                if (window.approvalChannel) {
                    supabase.removeChannel(window.approvalChannel);
                    window.approvalChannel = null;
                }
                document.getElementById('waiting-ui').classList.add('hidden');
                document.getElementById('main-form-ui').classList.remove('hidden');
                const txt = document.getElementById('submit-btn-text');
                if(txt) txt.innerText = `SEND FOR ${parseFloat(amountInput.value).toFixed(2)}`;
                submitBtn.disabled = false;
            };
            
            function listenForStreamerApproval(donationId) {
                window.approvalChannel = supabase.channel(`donation-${donationId}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'donations', filter: `id=eq.${donationId}` }, 
                    async payload => {
                        if (payload.new.status === 'approved') {
                            vibrate([100, 50, 100]);
                            document.getElementById('waiting-ui').classList.add('hidden');
                            document.getElementById('live-room-ui').classList.remove('hidden');
                            if (payload.new.join_token) await connectToLiveKit(payload.new.join_token);
                        } else if (payload.new.status === 'rejected') {
                            vibrate([100, 100]);
                            alert("Request declined.");
                            document.getElementById('waiting-ui').classList.add('hidden');
                            document.getElementById('main-form-ui').classList.remove('hidden');
                            submitBtn.innerText = `SEND FOR $${parseFloat(amountInput.value).toFixed(2)}`;
                            submitBtn.disabled = false;
                        }
                    }).subscribe();
            }

            async function connectToLiveKit(token) {
                try {
                    currentRoom = new LiveKitClient.Room();
                    await currentRoom.connect('wss://whutcha-drgxd8d7.livekit.cloud', token);
                    await currentRoom.localParticipant.enableCameraAndMicrophone();
                    
                    currentRoom.localParticipant.on('localTrackPublished', (publication) => {
                        if (publication.track && publication.track.kind === 'video') {
                            const vid = publication.track.attach();
                            vid.className = "w-full h-full object-cover";
                            document.getElementById('local-video-container').innerHTML = '';
                            document.getElementById('local-video-container').appendChild(vid);
                        }
                    });

                    currentRoom.on('trackSubscribed', (track) => {
                        const el = track.attach();
                        if (track.kind === 'video') {
                            el.className = "w-full h-full object-cover";
                            document.getElementById('remote-video-container').innerHTML = '';
                            document.getElementById('remote-video-container').appendChild(el);
                        }
                    });
                    
                    currentRoom.on('disconnected', () => {
                        alert("Streamer ended the call.");
                        window.location.reload();
                    });

                } catch (error) {
                    console.error(error);
                }
            }
            
            document.getElementById('btn-end-call').addEventListener('click', () => {
                vibrate([50, 50]);
                if(currentRoom) currentRoom.disconnect();
                window.location.reload();
            });

        });
