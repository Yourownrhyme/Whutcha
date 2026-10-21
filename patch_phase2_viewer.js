const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Inject canvas-confetti
if (!html.includes('canvas-confetti')) {
    html = html.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>\n</head>');
}

// 2. Inject Progress Bar UI into the Submit Button
const oldBtn = /<button id="submit-btn" class="w-full py-5 bg-gradient-to-r from-primary to-blue-500 text-black font-black text-xl rounded-2xl shadow-\[0_0_20px_rgba\(0,240,255,0\.4\)\] hover:opacity-90 transition-opacity uppercase tracking-wider">\s*SEND FOR \$5\.00\s*<\/button>/;

const newBtn = `
            <button id="submit-btn" class="w-full py-5 bg-gradient-to-r from-primary to-blue-500 text-black font-black text-xl rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:opacity-90 transition-all uppercase tracking-wider relative overflow-hidden">
                <div id="upload-progress-bar" class="absolute left-0 top-0 bottom-0 bg-white/30 w-0 transition-all duration-300 ease-out z-0"></div>
                <span id="submit-btn-text" class="relative z-10">SEND FOR $5.00</span>
            </button>
`;
html = html.replace(oldBtn, newBtn);
if (!html.includes('id="upload-progress-bar"')) {
    // Fallback if regex failed (due to formatting)
    html = html.replace(/<button id="submit-btn"[\s\S]*?<\/button>/, newBtn);
}

// 3. Rewrite the submit logic to use Progress Bar and Confetti
const submitLogicOld = /submitBtn\.innerText = "UPLOADING\.\.\.";[\s\S]*?submitBtn\.innerText = \`SEND FOR \$\\\$\\{amount\.toFixed\(2\)\}\`;\n\s*submitBtn\.disabled = false;\n\s*\}/m;

// Find the submit event listener block and rewrite it
let jsBlock = `
                const btnText = document.getElementById('submit-btn-text');
                const progressBar = document.getElementById('upload-progress-bar');
                
                btnText.innerText = "UPLOADING...";
                progressBar.style.width = '10%';
                
                // Simulate fake progress while uploading
                let fakeProgress = 10;
                const progressInterval = setInterval(() => {
                    if (fakeProgress < 85) {
                        fakeProgress += Math.random() * 15;
                        progressBar.style.width = \`\${fakeProgress}%\`;
                    }
                }, 500);

                try {
                    await new Promise(r => setTimeout(r, 1500)); // Simulate payment delay
                    
                    let generatedVideoHash = "costream_request";
                    if (currentTab === 'video') {
                        generatedVideoHash = \`vid_\${Date.now()}.\${finalVideoBlob.type.includes('webm') ? 'webm' : 'mp4'}\`;
                        const { error: uploadError } = await supabase.storage.from('videos').upload(generatedVideoHash, finalVideoBlob);
                        if(uploadError) throw uploadError;
                    }

                    const customId = 'WTCH-' + Math.floor(100000 + Math.random() * 900000);
                    const { data, error } = await supabase.from('donations').insert([{
                        id: customId, username: nickname, amount: amount,
                        videoHash: generatedVideoHash, video_hash: generatedVideoHash,
                        streamer_id: streamerId, status: 'pending'
                    }]).select();
                        
                    if (error) throw error;
                    
                    clearInterval(progressInterval);
                    progressBar.style.width = '100%';
                    
                    if (currentTab === 'costream') {
                        setTimeout(() => {
                            progressBar.style.width = '0%';
                            document.getElementById('main-form-ui').classList.add('hidden');
                            document.getElementById('waiting-ui').classList.remove('hidden');
                            listenForStreamerApproval(customId);
                        }, 500);
                    } else {
                        // FIRE CONFETTI
                        const duration = 3000;
                        const end = Date.now() + duration;
                        (function frame() {
                            confetti({
                                particleCount: 5,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0 },
                                colors: ['#00F0FF', '#9D00FF', '#FFFFFF']
                            });
                            confetti({
                                particleCount: 5,
                                angle: 120,
                                spread: 55,
                                origin: { x: 1 },
                                colors: ['#00F0FF', '#9D00FF', '#FFFFFF']
                            });
                            if (Date.now() < end) requestAnimationFrame(frame);
                        }());
                        
                        vibrate([100, 50, 100, 50, 200]);
                        btnText.innerText = "SUCCESS! 🎉";
                        
                        const { data: profile } = await supabase.from('profiles').select('external_pay_link').eq('id', streamerId).single();
                        
                        setTimeout(() => {
                            if (profile && profile.external_pay_link) {
                                btnText.innerText = "REDIRECTING...";
                                window.location.href = profile.external_pay_link;
                            } else {
                                alert(\`Success! Your $\${amount} donation was sent.\`);
                                if(retakeBtn) retakeBtn.click();
                                progressBar.style.width = '0%';
                                btnText.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                                submitBtn.disabled = false;
                            }
                        }, 2500);
                    }
                } catch (err) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '0%';
                    alert("Error: " + err.message);
                    btnText.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                    submitBtn.disabled = false;
                }
`;

// Replace the guts of the submitBtn.addEventListener
const regexTarget = /submitBtn\.innerText = "UPLOADING\.\.\.";[\s\S]*?submitBtn\.disabled = false;\n\s*\}/m;
html = html.replace(regexTarget, jsBlock);

// Also need to fix the updateSubmitBtn function to target btnText
html = html.replace(/submitBtn\.innerText = \\\`SEND FOR \$\\\$\\{val\.toFixed\(2\)\}\\\`;/g, 
    "const txt = document.getElementById('submit-btn-text'); if(txt) txt.innerText = `SEND FOR $${val.toFixed(2)}`; else submitBtn.innerText = `SEND FOR $${val.toFixed(2)}`;");

fs.writeFileSync('whutcha-web/viewer.html', html);
