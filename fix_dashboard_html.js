const fs = require('fs');

let dashHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

// 1. Remove the standalone Settings button (lines 119-122) and Legal & Terms (lines 124-127)
// Actually it's easier to replace the whole sidebar menu block.

const newSidebar = `                <a href="#" class="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Live Queue
                </a>
                
                <button onclick="window.openSettingsModal()" class="w-full flex items-center gap-3 px-4 py-3 text-silver hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all text-left">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Settings
                </button>`;

dashHtml = dashHtml.replace(/<a href="#" class="w-full flex items-center gap-3[\s\S]*?Legal & Terms\s*<\/button>/m, newSidebar);

// 2. Fix the Alerts Off button -> 🔔 Push Notifications
dashHtml = dashHtml.replace(/<button id="btn-request-push" class="w-full flex items-center gap-3 px-4 py-3 bg-white\/5 hover:bg-white\/10 rounded-xl border border-white\/10 transition-all font-bold text-sm">[\s\S]*?<\/button>/m, `<button id="btn-request-push" class="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all font-bold text-sm text-white">
                    <span id="notification-status" class="w-2 h-2 rounded-full bg-red-400"></span>
                    🔔 Push Notifications
                </button>`);

// 3. Add Terms of Use & Privacy Policy to the bottom of the main content
const footerHTML = `
            <!-- Footer -->
            <div class="mt-auto pt-10 pb-6 border-t border-white/5 flex justify-center gap-6">
                <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Terms of Use</a>
                <a href="#" class="text-silver text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">Privacy Policy</a>
            </div>
`;
dashHtml = dashHtml.replace(/<\/div>\s*<\/main>\s*<\/div>/m, footerHTML + '\n        </div>\n    </main>\n</div>');

fs.writeFileSync('whutcha-web/dashboard.html', dashHtml);
console.log("dashboard.html patched");
