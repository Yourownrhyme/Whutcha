const fs = require('fs');

// 1. Fix viewer playback camera flip
let viewer = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldPlayback = `<video id="playback-video" class="w-full h-full object-cover hidden" playsinline controls></video>`;
const newPlayback = `<video id="playback-video" class="w-full h-full object-cover hidden scale-x-[-1]" playsinline controls></video>`;

if (viewer.includes(oldPlayback)) {
    viewer = viewer.replace(oldPlayback, newPlayback);
    fs.writeFileSync('whutcha-web/viewer.html', viewer);
    console.log("Fixed viewer playback flip.");
}

// 2. Fix dashboard DAWG text
let dashboard = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const oldTitle = `<span class="text-5xl text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">W</span>HUTCHA</h1>`;
const newTitle = `<span class="text-5xl text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">W</span>HUTCHA, DAWG?</h1>`;

if (dashboard.includes(oldTitle)) {
    dashboard = dashboard.replace(oldTitle, newTitle);
    fs.writeFileSync('whutcha-web/dashboard.html', dashboard);
    console.log("Fixed WHUTCHA DAWG text.");
}

