        const supabaseUrl = 'https://kjoffilncbybquvjytxx.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

        let currentTab = 'video';
        let streamerId = null;
        let minVideoPrice = 5;
        let minCostreamPrice = 10;
        let currentMinPrice = 5;

        // MediaRecorder
        let stream = null;
        let mediaRecorder = null;
        let recordedChunks = [];
        let finalVideoBlob = null;
        let isRecording = false;

        const urlParams = new URLSearchParams(window.location.search);
        streamerId = urlParams.get('streamer');

        window.addEventListener('DOMContentLoaded', async () => {
            if (!streamerId) {
                document.body.innerHTML = '<div class="flex h-screen items-center justify-center"><h1 class="text-red-500 font-bold text-xl">Invalid Streamer Link</h1></div>';
                return;
            }

            // Fetch Streamer Profile
            const { data: profile } = await supabase.from('profiles').select('username, avatar_url, min_video_price, min_costream_price').eq('id', streamerId).single();
            if (profile) {
                document.getElementById('streamer-name').innerText = profile.username || 'Anonymous';
                document.getElementById('streamer-avatar').innerText = (profile.username || 'A').charAt(0).toUpperCase();
                if (profile.min_video_price) minVideoPrice = profile.min_video_price;
                if (profile.min_costream_price) minCostreamPrice = profile.min_costream_price;
            }

            updatePricing(minVideoPrice);
            await startCamera();
        });

        function updatePricing(minPrice) {
            currentMinPrice = minPrice;
            document.getElementById('min-price-label').innerText = `Min: $\${minPrice}`;
            document.getElementById('amount-input').value = minPrice;
            document.getElementById('amount-input').min = minPrice;
            document.getElementById('submit-btn-text').innerText = `SEND FOR $\${minPrice.toFixed(2)}`;

            const presets = [1, 2, 5, 10].map(m => m * minPrice);
            document.getElementById('price-presets').innerHTML = presets.map(p => 
                `<button type="button" class="preset-btn flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-sm hover:bg-white/10" data-val="\${p}">$\${p}</button>`
            ).join('');
            
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.addEventListener('click', (e) => {
                    document.getElementById('amount-input').value = e.target.dataset.val;
                    document.getElementById('submit-btn-text').innerText = `SEND FOR $\${parseFloat(e.target.dataset.val).toFixed(2)}`;
                });
            });
        }

        document.getElementById('amount-input').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            document.getElementById('submit-btn-text').innerText = `SEND FOR $\${val.toFixed(2)}`;
        });

        // Tabs
        document.getElementById('tab-video').addEventListener('click', async () => {
            currentTab = 'video';
            document.getElementById('tab-video').className = 'flex-1 py-3 text-sm font-black rounded-xl bg-primary text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all';
            document.getElementById('tab-costream').className = 'flex-1 py-3 text-sm font-black rounded-xl text-silver hover:text-white transition-all';
            document.getElementById('video-section').classList.remove('hidden');
            document.getElementById('costream-section').classList.add('hidden');
            updatePricing(minVideoPrice);
            await startCamera();
        });

        document.getElementById('tab-costream').addEventListener('click', () => {
            currentTab = 'costream';
            document.getElementById('tab-costream').className = 'flex-1 py-3 text-sm font-black rounded-xl bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all';
            document.getElementById('tab-video').className = 'flex-1 py-3 text-sm font-black rounded-xl text-silver hover:text-white transition-all';
            document.getElementById('video-section').classList.add('hidden');
            document.getElementById('costream-section').classList.remove('hidden');
            updatePricing(minCostreamPrice);
            if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
        });

        async function startCamera() {
            if (stream) stream.getTracks().forEach(t => t.stop());
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                document.getElementById('camera-preview').srcObject = stream;
            } catch (err) { console.error('Camera access denied:', err); }
        }

        // Recording
        const recordBtn = document.getElementById('record-btn');
        recordBtn.addEventListener('click', () => {
            if (!isRecording) {
                recordedChunks = [];
                const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? {mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 1000000} : {mimeType: 'video/mp4', videoBitsPerSecond: 1000000};
                mediaRecorder = new MediaRecorder(stream, options);
                mediaRecorder.ondataavailable = e => { if(e.data.size > 0) recordedChunks.push(e.data); };
                mediaRecorder.onstop = () => {
                    finalVideoBlob = new Blob(recordedChunks, {type: options.mimeType});
                    document.getElementById('camera-preview').classList.add('hidden');
                    const playback = document.getElementById('playback-video');
                    playback.src = URL.createObjectURL(finalVideoBlob);
                    playback.classList.remove('hidden');
                    document.getElementById('retake-ui').classList.remove('hidden');
                    document.getElementById('recording-ui').classList.add('hidden');
                };
                mediaRecorder.start();
                isRecording = true;
                recordBtn.innerHTML = '<div class="w-8 h-8 bg-red-500 rounded shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>';
            } else {
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.innerHTML = '<div class="w-12 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>';
            }
        });

        document.getElementById('retake-btn').addEventListener('click', () => {
            finalVideoBlob = null;
            document.getElementById('camera-preview').classList.remove('hidden');
            document.getElementById('playback-video').classList.add('hidden');
            document.getElementById('retake-ui').classList.add('hidden');
            document.getElementById('recording-ui').classList.remove('hidden');
        });

        // Submit Logic
        document.getElementById('submit-btn').addEventListener('click', async () => {
            const btn = document.getElementById('submit-btn');
            if (btn.disabled) return;
            
            const amount = parseFloat(document.getElementById('amount-input').value) || 0;
            if (amount < currentMinPrice) return alert(`Minimum is $\${currentMinPrice}`);
            if (currentTab === 'video' && !finalVideoBlob) return alert('Record a video first!');

            btn.disabled = true;
            document.getElementById('submit-btn-text').innerText = "PROCESSING...";

            try {
                let videoHash = "costream_request";
                if (currentTab === 'video') {
                    videoHash = `vid_\${crypto.randomUUID()}.\${finalVideoBlob.type.includes('webm') ? 'webm' : 'mp4'}`;
                    const { error } = await supabase.storage.from('videos').upload(videoHash, finalVideoBlob);
                    if (error) throw error;
                }

                const { error } = await supabase.from('donations').insert([{
                    id: 'WTCH-' + Math.floor(100000 + Math.random() * 900000),
                    streamer_id: streamerId,
                    amount: amount,
                    username: document.getElementById('nickname').value || 'Anonymous',
                    videoHash: videoHash,
                    video_hash: videoHash,
                    status: currentTab === 'costream' ? 'approved' : 'pending' // For MVP, auto-approve costreams so they can connect
                }]);
                
                if (error) throw error;

                if (currentTab === 'costream') {
                    alert("Co-stream requested! In a real app, this waits for streamer approval.");
                    // Simplified: We would connect to LiveKit here
                } else {
                    document.getElementById('submit-btn-text').innerText = "SUCCESS! 🎉";
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }

            } catch (err) {
                console.error(err);
                alert("Error: " + err.message);
                btn.disabled = false;
                document.getElementById('submit-btn-text').innerText = `SEND FOR $\${amount.toFixed(2)}`;
            }
        });
