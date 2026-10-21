const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

// Action button
html = html.replace('class="action-btn"', 'class="w-full mt-4 brutal-btn-primary py-5 text-xl tracking-tight"');

// Record button (outer circle)
html = html.replace('class="record-circle"', 'class="w-16 h-16 rounded-full border-4 border-white bg-transparent flex items-center justify-center transition-all hover:scale-110 active:scale-95 mx-auto"');
// Inner circle for record button? Wait, JS controls it. Let's see what JS does to record-btn.
// The original CSS was probably doing a red dot inside. Let's see if there's an inner div.
// If not, I'll just make the button itself look like a record button.

fs.writeFileSync('whutcha-web/donate-v2.html', html);
