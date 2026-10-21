const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

// Replace brutal-card with glass-card
dash = dash.replace(/card\.className = 'brutal-card p-6 flex flex-col md:flex-row gap-6 border-4';/g, 
"card.className = 'glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 relative overflow-hidden group border border-white/10';");

// Replace the inner HTML of the card to match Liquid Silver
dash = dash.replace(/card\.innerHTML = \`[\s\S]*?<\/div>[\s\S]*?\`;/, 
`card.innerHTML = \`
    <div class="absolute inset-0 bg-gradient-to-r \${isCoStream ? 'from-secondary/10' : 'from-primary/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    <div class="relative w-full md:w-48 h-48 md:h-32 bg-black rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
        \${isCoStream 
            ? '<div class="w-full h-full flex flex-col items-center justify-center bg-secondary/20"><svg class="w-8 h-8 text-secondary mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="font-black text-xs text-secondary uppercase tracking-widest">Co-Stream</span></div>'
            : \`<video src="\${videoUrl}" class="w-full h-full object-cover" controls preload="metadata"></video>\`
        }
        <span class="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white font-black px-2 py-1 text-[10px] rounded uppercase shadow border border-white/10">15:00</span>
    </div>
    <div class="flex-1 flex flex-col justify-between relative z-10">
        <div>
            <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase \${isCoStream ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-primary/20 text-primary border border-primary/30'} shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                    \${isCoStream ? 'Live Request' : 'Video Msg'}
                </span>
            </div>
            <h4 class="text-xl font-bold text-white mb-1">\${sanitize(d.username)}</h4>
            <p class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r \${isCoStream ? 'from-secondary to-purple-400' : 'from-primary to-green-400'}">
                $\${d.amount}
            </p>
        </div>
        
        <div class="flex flex-wrap gap-2 mt-4">
            <button onclick="approveDonation('\${d.id}', \${isCoStream}, '\${sanitize(d.username)}')" class="flex-1 py-2 px-4 bg-white hover:bg-gray-200 text-black font-black text-sm rounded-xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                \${isCoStream ? 'Accept & Join' : 'Approve Video'}
            </button>
            \${!isCoStream ? \`<button onclick="openReactionModal('\${d.id}', '\${videoUrl}')" class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl transition-colors">Reaction</button>\` : ''}
            <button onclick="rejectDonation('\${d.id}')" class="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm rounded-xl transition-colors">
                Reject
            </button>
        </div>
    </div>
\`;`);

fs.writeFileSync('whutcha-web/dashboard.js', dash);
