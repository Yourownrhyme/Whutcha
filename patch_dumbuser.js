const fs = require('fs');

let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

// 1. Add the text hint
const oldRecordContainer = `<div class="flex justify-center w-full pointer-events-auto" id="record-btn-container">`;
const newRecordContainer = `<!-- DUMB USER MODE: Visual Prompt -->
                    <div id="record-hint" class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-black text-xs uppercase tracking-widest border border-white/10 animate-pulse pointer-events-none">
                        Tap to Record Video
                    </div>
                    <div class="flex justify-center w-full pointer-events-auto" id="record-btn-container">`;

if (!html.includes('DUMB USER MODE: Visual Prompt')) {
    html = html.replace(oldRecordContainer, newRecordContainer);
}

// 2. Hide hint on record and add scroll-to-nickname on stop
const oldRecordStart = `isRecording = true;
                recordBtn.innerHTML = '<div class="w-8 h-8 bg-red-500 rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-[10px] font-black text-white">REC</div>';`;

const newRecordStart = `isRecording = true;
                document.getElementById('record-hint').style.display = 'none'; // DUMB USER MODE: Hide hint
                recordBtn.innerHTML = '<div class="w-8 h-8 bg-red-500 rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-[10px] font-black text-white">REC</div>';`;

if (!html.includes('document.getElementById(\'record-hint\').style.display = \'none\'')) {
    html = html.replace(oldRecordStart, newRecordStart);
}

const oldRecordStop = `document.getElementById('retake-ui').classList.remove('hidden');
                    document.getElementById('recording-ui').classList.add('hidden');
                };`;

const newRecordStop = `document.getElementById('retake-ui').classList.remove('hidden');
                    document.getElementById('recording-ui').classList.add('hidden');
                    
                    // DUMB USER MODE: Guide the user to the next step
                    const nickInput = document.getElementById('nickname');
                    nickInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    nickInput.classList.add('ring-4', 'ring-primary', 'shadow-[0_0_20px_rgba(0,240,255,0.5)]');
                    setTimeout(() => {
                        nickInput.classList.remove('ring-4', 'ring-primary', 'shadow-[0_0_20px_rgba(0,240,255,0.5)]');
                    }, 1500);
                };`;

if (!html.includes('DUMB USER MODE: Guide the user')) {
    html = html.replace(oldRecordStop, newRecordStop);
}

// 3. Make the retake button put the hint back
const oldRetake = `document.getElementById('recording-ui').classList.remove('hidden');`;
const newRetake = `document.getElementById('recording-ui').classList.remove('hidden');
            document.getElementById('record-hint').style.display = 'block'; // Restore hint`;

if (!html.includes('Restore hint')) {
    html = html.replace(oldRetake, newRetake);
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('Dumb User Mode patched.');
