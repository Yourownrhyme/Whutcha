const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Add maximum recording time limit to the recordBtn click listener
const originalRecordStart = `                isRecording = true;
                recordBtn.innerHTML = '<div class="w-8 h-8 bg-red-500 rounded shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>';
            } else {
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.innerHTML = '<div class="w-12 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>';
            }
        });`;

const trollRecordStart = `                isRecording = true;
                recordBtn.innerHTML = '<div class="w-8 h-8 bg-red-500 rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-[10px] font-black text-white">REC</div>';
                
                // TROLL MODE: Auto-stop recording after 30 seconds
                window.recordTimeout = setTimeout(() => {
                    if (isRecording) {
                        mediaRecorder.stop();
                        isRecording = false;
                        recordBtn.innerHTML = '<div class="w-12 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>';
                        alert("Time limit reached (30s max for video donations).");
                    }
                }, 30000);

            } else {
                if (window.recordTimeout) clearTimeout(window.recordTimeout);
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.innerHTML = '<div class="w-12 h-12 bg-primary rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>';
            }
        });`;

if (!html.includes('Auto-stop recording after 30 seconds')) {
    html = html.replace(originalRecordStart, trollRecordStart);
}

// 2. Add blob size limit to submit logic
const originalUpload = `                if (currentTab === 'video') {
                    videoHash = \`vid_\${crypto.randomUUID()}.\${finalVideoBlob.type.includes('webm') ? 'webm' : 'mp4'}\`;
                    const { error } = await supabase.storage.from('videos').upload(videoHash, finalVideoBlob);
                    if (error) throw error;
                }`;

const trollUpload = `                if (currentTab === 'video') {
                    // TROLL MODE: Hard limit file size before upload (25 MB)
                    const MAX_FILE_SIZE = 25 * 1024 * 1024;
                    if (finalVideoBlob.size > MAX_FILE_SIZE) {
                        throw new Error(\`Video is too large! (\${(finalVideoBlob.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is 25MB.\`);
                    }

                    videoHash = \`vid_\${crypto.randomUUID()}.\${finalVideoBlob.type.includes('webm') ? 'webm' : 'mp4'}\`;
                    const { error } = await supabase.storage.from('videos').upload(videoHash, finalVideoBlob);
                    if (error) throw error;
                }`;

if (!html.includes('Hard limit file size before upload')) {
    html = html.replace(originalUpload, trollUpload);
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('viewer.html patched for Troll Mode.');
