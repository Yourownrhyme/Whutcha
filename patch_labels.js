const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// Replace Viewer Link text block
const oldViewerBlock = `<p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Share this link to get Video Donations & Co-streams!</p>
                <div class="flex items-center gap-2 mt-2">`;
const newViewerBlock = `<p class="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Share this link to get Video Donations & Co-streams!</p>
                <p class="text-[10px] text-primary/80 font-bold mb-2 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    FOR VIEWERS
                </p>
                <div class="flex items-center gap-2 mt-2">`;
html = html.replace(oldViewerBlock, newViewerBlock);

// Replace OBS block
const oldObsBlock = `<h3 class="font-bold mb-2">OBS Overlay</h3>
                    <p class="text-xs text-gray-400 mb-4">Add this URL as a Browser Source in OBS to show live donations on your stream.</p>
                    <button onclick="copyOverlayUrl()"`;
const newObsBlock = `<h3 class="font-bold mb-1">OBS Overlay</h3>
                    <p class="text-[10px] text-secondary/80 font-bold mb-2 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                        FOR STREAMERS
                    </p>
                    <p class="text-xs text-gray-400 mb-4">Add this URL as a Browser Source in OBS to show live donations on your stream.</p>
                    <button onclick="copyOverlayUrl()"`;
html = html.replace(oldObsBlock, newObsBlock);

fs.writeFileSync('whutcha-web/dashboard.html', html);
