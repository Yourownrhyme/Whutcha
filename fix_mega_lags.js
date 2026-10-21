const fs = require('fs');
const files = ['whutcha-web/index.html', 'whutcha-web/dashboard.html', 'whutcha-web/viewer.html', 'whutcha-web/leaderboard.html'];

files.forEach(file => {
    if(!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');

    // 1. Remove animate-pulse from background gradients
    html = html.replace(/animate-pulse transform-gpu will-change-opacity/g, 'transform-gpu will-change-opacity');
    
    // 2. Dashboard: Replace aside backdrop-blur with solid color
    html = html.replace(/bg-white\/\[0\.02\] backdrop-blur-3xl/g, 'bg-[#0f0f12]');
    // 3. Dashboard: Replace main backdrop-blur with solid color
    html = html.replace(/bg-white\/\[0\.01\] backdrop-blur-xl/g, 'bg-[#0a0a0c]');
    
    // 4. Viewer/Dashboard inner cards: Replace backdrop-blur with solid color
    // bg-white/[0.02] backdrop-blur-xl
    html = html.replace(/bg-white\/\[0\.02\] backdrop-blur-xl/g, 'bg-[#151518]');
    // bg-white/[0.02] backdrop-blur-3xl (used in Viewer form)
    html = html.replace(/bg-white\/\[0\.02\] backdrop-blur-3xl/g, 'bg-[#0f0f12]');
    // bg-[#0A0A0B]/80 backdrop-blur-3xl (used in Index form)
    html = html.replace(/bg-\[#0A0A0B\]\/80 backdrop-blur-3xl/g, 'bg-[#0b0c10]');
    
    // 5. Buttons with backdrop-blur in Index (Zero Fees, Safe Moderation)
    html = html.replace(/bg-white\/5 border border-white\/10 backdrop-blur-xl/g, 'bg-[#1a1a20] border border-[#2d2d35]');
    
    // 6. Viewer specific: Tab container
    // class="flex gap-2 p-1.5 bg-white/[0.03] backdrop-blur-2xl
    html = html.replace(/bg-white\/\[0\.03\] backdrop-blur-2xl/g, 'bg-[#1a1a20]');
    
    // 7. Modals: Remove backdrop-blur-md from backgrounds, make them darker solid
    html = html.replace(/bg-black\/60 backdrop-blur-md/g, 'bg-black/90');
    
    // 8. Mobile nav: Remove backdrop-blur-xl
    html = html.replace(/backdrop-blur-xl bg-background\/80/g, 'bg-[#0b0d12]');

    fs.writeFileSync(file, html);
    console.log('Removed heavy compositing from ' + file);
});
