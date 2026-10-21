const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const oldCardClass = `card.className = 'bg-surface p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row gap-6';`;
const newCardClass = `card.className = 'brutal-card p-6 flex flex-col md:flex-row gap-6 border-4';`;

js = js.replace(oldCardClass, newCardClass);

const oldCardInner = /card\.innerHTML = `[\s\S]*?`;/;

const newCardInner = `card.innerHTML = \`
            <!-- Video / Avatar Area -->
            <div class="w-full md:w-72 h-48 bg-black rounded-xl overflow-hidden relative flex-shrink-0 border-4 border-surface shadow-[4px_4px_0_#D8FF00]">
                \${isCoStream 
                    ? \`<div class="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 text-green-400">
                         <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                         <span class="font-black uppercase tracking-widest text-lg">Live Co-Stream</span>
                       </div>\`
                    : \`<video src="\${videoUrl}" class="w-full h-full object-cover" controls preload="metadata"></video>\`
                }
            </div>
            
            <!-- Details & Actions -->
            <div class="flex-1 flex flex-col justify-between py-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-3xl font-black uppercase tracking-tighter">\${d.username}</h3>
                        <div class="flex gap-2 items-center mt-2">
                            <span class="inline-block px-3 py-1 bg-surface text-gray-300 rounded font-black text-xs uppercase border-2 border-transparent">
                                \${new Date(d.created_at).toLocaleTimeString()}
                            </span>
                            <span id="sla-\${d.id}" class="inline-block px-3 py-1 bg-primary text-black rounded font-black text-xs uppercase shadow-[2px_2px_0_#fff]">
                                15:00
                            </span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-4xl font-black text-primary" style="text-shadow: 2px 2px 0 #FF0055;">+\$\${d.amount.toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-4 mt-6">
                    <button onclick="\${isCoStream ? \`joinCoStream('\${d.id}')\` : \`updateStatus('\${d.id}', 'approved')\`}" class="brutal-btn-primary flex-1 py-4 px-6 text-sm flex items-center justify-center border-black bg-primary">
                        \${isCoStream ? 'ACCEPT & JOIN' : 'PLAY IN OBS'}
                    </button>
                    
                    \${!isCoStream ? \`
                    <button onclick="openReactionModal('\${videoUrl}')" class="brutal-btn-primary py-4 px-6 text-sm bg-secondary border-black text-white shadow-[4px_4px_0_#D8FF00]">
                        REACTION
                    </button>
                    \` : ''}
                    
                    <button onclick="updateStatus('\${d.id}', 'rejected')" class="brutal-btn-secondary py-4 px-6 text-sm text-gray-400 hover:text-white">
                        REJECT
                    </button>
                </div>
            </div>
        \`;`;

js = js.replace(oldCardInner, newCardInner);

fs.writeFileSync('whutcha-web/dashboard.js', js);
