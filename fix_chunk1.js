const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Fetch external_pay_link
html = html.replace(/let minVideoPrice = 5;/, "let minVideoPrice = 5;\n        let payoutLink = '';");
html = html.replace(/if \(profile.min_costream_price\) minCostreamPrice = profile.min_costream_price;/, "if (profile.min_costream_price) minCostreamPrice = profile.min_costream_price;\n                if (profile.external_pay_link) payoutLink = profile.external_pay_link;");

// 2. Fix the missing redirect & memory leak
const oldSubmitLogic = `                if (error) {
                    if (error.message.includes('SKYNET_BLOCKED')) {
                        alert("Spam protection triggered. Please wait 1 minute before sending another donation.");
                        btn.disabled = false;
                        document.getElementById('submit-btn-text').innerText = "PAY & SEND";
                        return;
                    }
                    throw error;
                }
                if (currentTab === 'costream') {
                    alert("Co-stream requested! In a real app, this waits for streamer approval.");
                    // Simplified: We would connect to LiveKit here
                } else {
                    document.getElementById('submit-btn-text').innerText = "SUCCESS! 🎉";
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    // VAMPIRE MODE: Turn off camera to save fan's battery/CPU after successful send
                    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
                }`;

const newSubmitLogic = `                if (error) {
                    // STRYKER DOCTRINE: Rollback Storage if DB insert fails! (Anti-Leak)
                    if (videoHash !== "costream_request") {
                        await supabase.storage.from('videos').remove([videoHash]);
                        console.log("Rolled back orphaned video blob from storage.");
                    }
                    
                    if (error.message.includes('SKYNET_BLOCKED')) {
                        alert("Spam protection triggered. Please wait 1 minute before sending another donation.");
                        btn.disabled = false;
                        document.getElementById('submit-btn-text').innerText = "PAY & SEND";
                        return;
                    }
                    throw error;
                }
                
                if (currentTab === 'costream') {
                    alert("Co-stream requested! In a real app, this waits for streamer approval.");
                    // Simplified: We would connect to LiveKit here
                } else {
                    // ECONOMICS FIX: Redirect to actual payment link!
                    // VAMPIRE MODE: Turn off camera to save fan's battery/CPU after successful send
                    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
                    
                    if (payoutLink) {
                        document.getElementById('submit-btn-text').innerText = "REDIRECTING TO PAYMENT...";
                        setTimeout(() => {
                            window.location.href = payoutLink;
                        }, 1000);
                    } else {
                        document.getElementById('submit-btn-text').innerText = "SUCCESS! 🎉";
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                }`;

if (html.includes(oldSubmitLogic)) {
    html = html.replace(oldSubmitLogic, newSubmitLogic);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Chunk 1 Fixed!");
} else {
    console.log("Regex failed, doing it manually...");
}
