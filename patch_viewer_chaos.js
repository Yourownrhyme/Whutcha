const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldRecordEvt = `const recordBtn = document.getElementById('record-btn');
        recordBtn.addEventListener('click', () => {
            if (!isRecording) {`;
            
const newRecordEvt = `const recordBtn = document.getElementById('record-btn');
        let isRecordLocked = false;
        recordBtn.addEventListener('click', () => {
            if (isRecordLocked) return;
            isRecordLocked = true;
            setTimeout(() => isRecordLocked = false, 500); // CHAOS MONKEY: Debounce 500ms
            
            if (!isRecording) {`;

if (!html.includes('isRecordLocked')) {
    html = html.replace(oldRecordEvt, newRecordEvt);
}

const oldSubmitEvt = `document.getElementById('submit-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;`;
            
const newSubmitEvt = `document.getElementById('submit-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            if (btn.hasAttribute('data-locked')) return; // CHAOS MONKEY
            btn.setAttribute('data-locked', 'true');
            setTimeout(() => btn.removeAttribute('data-locked'), 2000);`;
            
if (!html.includes('btn.hasAttribute(\'data-locked\')')) {
    html = html.replace(oldSubmitEvt, newSubmitEvt);
}

fs.writeFileSync('whutcha-web/viewer.html', html);
console.log('viewer.html Chaos Monkey applied.');
