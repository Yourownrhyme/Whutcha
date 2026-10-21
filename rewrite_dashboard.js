const fs = require('fs');

const dashHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Whutcha | Streamer Dashboard</title>
    
    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#1a1d24">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit.umd.min.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        background: '#1a1d24',
                        surface: '#252a34',
                        primary: '#00F0FF',
                        secondary: '#9D00FF',
                        silver: '#b0b5c0'
                    }
                }
            }
        }
    </script>
    
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #1a1d24; color: #fff; }
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .text-glow { text-shadow: 0 0 15px rgba(0, 240, 255, 0.4); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        /* Tooltip base */
        .group:hover .tooltip { opacity: 1; visibility: visible; transform: translateY(0); }
    </style>
</head>
<body class="bg-background min-h-screen flex flex-col md:flex-row relative custom-scrollbar">

    <!-- Global Background Elements -->
    <div class="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface via-background to-black opacity-80 pointer-events-none"></div>
    <div class="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

    <!-- SIDEBAR -->
    <aside class="w-full md:w-72 h-auto md:h-screen glass-card flex flex-col justify-between p-6 z-20 relative border-r border-white/10 shrink-0">
        <div>
            <!-- Logo -->
            <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <div class="w-full h-full bg-surface rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <h1 class="text-2xl font-black tracking-tight text-glow">Whutcha</h1>
            </div>

            <!-- Nav Links -->
            <nav class="space-y-2">
                <a href="#" class="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5 shadow-inner">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    Live Queue
                </a>
                <button onclick="openModal('legal-modal-tos')" class="w-full flex items-center gap-3 px-4 py-3 text-silver hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all text-left">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Legal & Terms
                </button>
            </nav>
        </div>

        <div class="space-y-4">
            <!-- PWA Install -->
            <button id="pwa-install-banner" class="hidden w-full relative group overflow-hidden rounded-xl p-[1px] mb-2">
                <div class="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-50 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <div class="relative flex items-center justify-center gap-2 bg-surface w-full py-3 rounded-xl transition-all">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span class="font-bold text-white text-sm">Install Desktop App</span>
                </div>
            </button>
            
            <button onclick="signOut()" class="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-bold transition-all border border-transparent hover:border-red-500/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Sign Out
            </button>
        </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 h-screen overflow-y-auto p-4 md:p-10 relative z-10 custom-scrollbar pb-32">
        <div class="max-w-5xl mx-auto space-y-8">
            
            <!-- Welcome Header -->
            <header class="flex justify-between items-end">
                <div>
                    <h2 class="text-3xl font-black text-white tracking-tight mb-1">Welcome back</h2>
                    <p class="text-silver text-sm">Manage your interactive streams and payout settings.</p>
                </div>
                <div class="px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    System Online
                </div>
            </header>

            <!-- PAYOUT LINK WIDGET -->
            <section class="glass-card rounded-3xl p-6 relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="text-lg font-bold text-white">Payout Link</h3>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-primary/20 text-primary uppercase">Required</span>
                        </div>
                        <p class="text-silver text-xs mb-4">Paste your DonationAlerts, Boosty, or PayPal link. Viewers will be sent here after recording a video.</p>
                        <div class="flex gap-2">
                            <input type="url" id="payout-link-input" placeholder="https://donationalerts.com/r/..." class="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600">
                            <button onclick="savePayoutLink(this)" class="px-6 bg-white text-black font-black text-sm rounded-xl hover:bg-gray-200 transition-colors shrink-0">SAVE</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- LINKS GRID -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- Viewer Link -->
                <div class="glass-card rounded-3xl p-6 flex flex-col justify-between relative group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                Viewer Link
                                <div class="relative group cursor-help">
                                    <svg class="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div class="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-white/10 rounded-lg text-xs text-silver shadow-xl opacity-0 visibility-hidden transform translate-y-2 transition-all z-50 text-center">
                                        Paste this in your Twitch chat (!donate) or channel panels.
                                    </div>
                                </div>
                            </h3>
                            <p class="text-silver text-xs mt-1">Send to viewers to get videos.</p>
                        </div>
                    </div>
                    <div class="flex flex-col xl:flex-row items-center gap-2">
                        <code id="viewer-link" class="bg-black/40 border border-white/10 p-3 rounded-xl w-full truncate text-xs text-primary">Loading...</code>
                        <div class="flex gap-2 w-full xl:w-auto">
                            <button onclick="copyViewerLink(this)" class="flex-1 xl:flex-none p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors flex justify-center items-center text-white shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </button>
                            <button onclick="window.open(document.getElementById('viewer-link').textContent, '_blank')" class="flex-1 xl:flex-none p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl transition-colors flex justify-center items-center shrink-0 font-bold text-xs uppercase">
                                Preview
                            </button>
                        </div>
                    </div>
                </div>

                <!-- OBS Link -->
                <div class="glass-card rounded-3xl p-6 flex flex-col justify-between relative group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                                OBS Overlay Link
                                <div class="relative group cursor-help">
                                    <svg class="w-4 h-4 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <div class="tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface border border-white/10 rounded-lg text-xs text-silver shadow-xl opacity-0 visibility-hidden transform translate-y-2 transition-all z-50 text-center">
                                        Add as a Browser Source in OBS. Recommended size: 1920x1080. Check "Control audio via OBS".
                                    </div>
                                </div>
                            </h3>
                            <p class="text-silver text-xs mt-1">Widget for your broadcast software.</p>
                        </div>
                    </div>
                    <button onclick="copyObsLink(this)" class="w-full py-4 bg-gradient-to-r from-secondary to-purple-600 hover:from-purple-500 hover:to-secondary text-white font-black text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(157,0,255,0.3)] flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        COPY OBS LINK
                    </button>
                    <code id="obs-link" class="hidden"></code>
                </div>

            </section>

            <!-- LIVE QUEUE -->
            <section class="mt-8">
                <div class="flex justify-between items-end mb-6">
                    <div>
                        <h2 class="text-2xl font-black text-white flex items-center gap-3">
                            <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                            Live Queue
                        </h2>
                    </div>
                    <div class="px-4 py-2 glass-card rounded-xl border border-white/10 flex items-center gap-3">
                        <span class="text-2xl font-black text-white" id="queue-count">0</span>
                        <span class="text-[10px] font-black text-silver uppercase leading-tight">Pending<br>Videos</span>
                    </div>
                </div>

                <div id="queue-container" class="space-y-4">
                    <!-- Cards injected via JS -->
                </div>
                
                <div id="empty-state" class="text-center py-20 glass-card rounded-3xl border-dashed border-white/20">
                    <div class="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                        <svg class="w-8 h-8 text-silver" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold text-white">Queue is Empty</h3>
                    <p class="text-silver text-sm mt-1">Waiting for incoming video donations.</p>
                </div>
            </section>
        </div>
    </main>
    
    <!-- Legal Modals -->
    <div id="legal-modal-tos" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex-col items-center justify-center p-6 opacity-0 transition-opacity duration-300">
        <div class="w-full max-w-lg glass-card p-8 rounded-3xl text-left h-[75vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative transform scale-95 transition-transform duration-300" id="tos-content">
            <button onclick="closeModal('legal-modal-tos')" class="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 class="text-2xl font-black mb-6 text-white">Terms of Use</h3>
            <div class="flex-1 overflow-y-auto text-sm text-silver space-y-5 pr-4 custom-scrollbar">
                <p>Welcome to Whutcha Streamer Platform.</p>
                <p><strong>1. Payouts:</strong> Whutcha routes viewers to your external wallet. Ensure your Payout Link is correct.</p>
                <p><strong>2. Moderation:</strong> You hold the right to reject videos. Rejected videos are deleted from the database.</p>
            </div>
            <button onclick="closeModal('legal-modal-tos')" class="mt-6 w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors">Close</button>
        </div>
    </div>
    
    <!-- Modals for Video/Co-Stream (Currently hidden/styled minimal for JS injection) -->
    <!-- Co-Stream Modal -->
    <div id="costream-modal" class="fixed inset-0 z-[110] bg-black/80 backdrop-blur-lg hidden flex-col items-center justify-center p-6">
        <!-- Will be overhauled in Phase 4 -->
    </div>
    <!-- Reaction Modal -->
    <div id="reaction-modal" class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg hidden flex-col items-center justify-center p-6">
        <!-- Will be overhauled in Phase 4 -->
    </div>

    <!-- Scripts -->
    <script>
        function vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }
        function openModal(id) {
            vibrate([50]);
            const modal = document.getElementById(id);
            const content = modal.querySelector('div');
            modal.classList.remove('hidden');
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
            if(content) content.classList.remove('scale-95');
        }
        function closeModal(id) {
            vibrate([50]);
            const modal = document.getElementById(id);
            const content = modal.querySelector('div');
            modal.classList.add('opacity-0');
            if(content) content.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
    </script>
    <script type="module" src="./dashboard.js?v=25"></script>
</body>
</html>`;

fs.writeFileSync('whutcha-web/dashboard.html', dashHTML);
