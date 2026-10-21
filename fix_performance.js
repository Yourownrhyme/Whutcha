const fs = require('fs');

const files = ['whutcha-web/index.html', 'whutcha-web/dashboard.html', 'whutcha-web/viewer.html', 'whutcha-web/leaderboard.html'];

files.forEach(file => {
    if(!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');
    
    // 1. Replace 800px Primary Glows
    html = html.replace(/<div class="([^"]*)w-\[800px\] h-\[800px\] bg-primary\/[0-9]+ rounded-full blur-\[[0-9]+px\] mix-blend-screen animate-pulse([^"]*)"><\/div>/g,
    '<div class="$1 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,240,255,0.15)_0%,transparent_60%)] rounded-full animate-pulse transform-gpu will-change-opacity $2"></div>');
    
    // 2. Replace 600px Purple Glows
    html = html.replace(/<div class="([^"]*)w-\[600px\] h-\[600px\] bg-\[#9D00FF\]\/[0-9]+ rounded-full blur-\[[0-9]+px\] mix-blend-screen animate-pulse([^"]*)"([^>]*)><\/div>/g,
    '<div class="$1 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(157,0,255,0.15)_0%,transparent_60%)] rounded-full animate-pulse transform-gpu will-change-opacity $2" $3></div>');

    // 3. Replace index.html specific left/right panel glows
    html = html.replace(/<div class="([^"]*)w-\[300px\] h-\[300px\] bg-primary\/[0-9]+ rounded-full blur-\[[0-9]+px\] animate-pulse([^"]*)"><\/div>/g,
    '<div class="$1 w-[500px] h-[500px] -translate-x-1/4 -translate-y-1/4 bg-[radial-gradient(circle,rgba(0,240,255,0.15)_0%,transparent_60%)] rounded-full animate-pulse transform-gpu will-change-opacity $2"></div>');

    html = html.replace(/<div class="([^"]*)w-\[400px\] h-\[400px\] bg-\[#9D00FF\]\/[0-9]+ rounded-full blur-\[[0-9]+px\] mix-blend-screen animate-pulse([^"]*)"([^>]*)><\/div>/g,
    '<div class="$1 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(157,0,255,0.15)_0%,transparent_60%)] rounded-full animate-pulse transform-gpu will-change-opacity $2" $3></div>');

    // 4. Replace other generic static blurs
    html = html.replace(/w-\[600px\] h-\[600px\] bg-primary\/20 blur-\[150px\] rounded-full/g, 
    'w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,240,255,0.1)_0%,transparent_60%)] transform-gpu');
    
    html = html.replace(/w-\[50%\] h-\[50%\] bg-primary\/20 blur-\[150px\]/g, 
    'w-[100vw] h-[100vh] bg-[radial-gradient(circle,rgba(0,240,255,0.05)_0%,transparent_50%)] transform-gpu');
    html = html.replace(/w-\[50%\] h-\[50%\] bg-primary\/10 blur-\[150px\]/g, 
    'w-[100vw] h-[100vh] bg-[radial-gradient(circle,rgba(0,240,255,0.05)_0%,transparent_50%)] transform-gpu');

    // 5. Fix camera mirroring in viewer.html
    if(file.includes('viewer.html')) {
        html = html.replace(/<video id="camera-preview" class="w-full h-full object-cover" autoplay playsinline muted><\/video>/,
        '<video id="camera-preview" class="w-full h-full object-cover scale-x-[-1]" autoplay playsinline muted></video>');
    }

    fs.writeFileSync(file, html);
    console.log('Optimized ' + file);
});
