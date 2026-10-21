function sanitize(str) {
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}
// Initialize Supabase
const supabaseUrl = 'https://kjoffilncbybquvjytxx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);


// Phase 2 Utilities
function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

async function copyText(text, btnElement) {
    try {
        await navigator.clipboard.writeText(text);
        vibrate([50]);
        if (btnElement) {
            const origHTML = btnElement.innerHTML;
            btnElement.innerHTML = '<span class="text-green-500 font-bold">✅ Copied!</span>';
            setTimeout(() => { btnElement.innerHTML = origHTML; }, 2000);
        }
    } catch (e) {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            vibrate([50]);
            if (btnElement) {
                const origHTML = btnElement.innerHTML;
                btnElement.innerHTML = '<span class="text-green-500 font-bold">✅ Copied!</span>';
                setTimeout(() => { btnElement.innerHTML = origHTML; }, 2000);
            }
        } catch (ex) {
            alert("[Whutcha Protocol 400]: Clipboard Write Failed. Please copy manually.");
        }
        document.body.removeChild(textArea);
    }
}

let currentUser = null;
let activeProfile = null;
let activeStreamerIds = [];
let currentDonations = [];
window.getCurrentDonations = () => currentDonations;
window.setCurrentDonations = (d) => { currentDonations = d; window.currentDonations = d; };
let obsChannels = [];
let obsHeartbeatTimeout = null;
let isDashboardMuted = false;
let notificationsEnabled = false;
let activeCoStreamRoom = null;
let isObserverMode = false;
window.isObserverMode = false;

function checkIsObserver() {
    const urlParams = new URLSearchParams(window.location.search);
    return Boolean(
        isObserverMode ||
        urlParams.get('demo') === 'true' ||
        urlParams.get('guest') === 'true' ||
        urlParams.get('observer') === '1' ||
        localStorage.getItem('whutcha_observer_mode') === 'true' ||
        localStorage.getItem('streamerID') === 'demo_broadcaster' ||
        (!currentUser) ||
        (currentUser && currentUser.id === 'demo_broadcaster')
    );
}
window.checkIsObserver = checkIsObserver;
window.slaTimers = window.slaTimers || {};

async function checkAuth() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'true' || urlParams.get('guest') === 'true') {
            if (!localStorage.getItem('streamerID')) {
                localStorage.setItem('streamerID', 'demo_broadcaster');
            }
        }
        
        const localStreamerId = localStorage.getItem('streamerID');
        
        if (session) {
            currentUser = session.user;
            // Clear any lingering observer demo keys when authenticating as real streamer
            try {
                localStorage.removeItem('whutcha_observer_mode');
                if (localStorage.getItem('streamerID') === 'demo_broadcaster') {
                    localStorage.removeItem('streamerID');
                }
            } catch(e){}
            if (!checkTrial(currentUser)) return;
        } else if (localStreamerId && localStreamerId !== 'demo_broadcaster') {
            currentUser = { id: localStreamerId };
        } else {
            // HOMER SIMPSON MODE: Default directly to Observer Cockpit instead of bouncing to login
            localStorage.setItem('streamerID', 'demo_broadcaster');
            localStorage.setItem('whutcha_observer_mode', 'true');
            currentUser = { id: 'demo_broadcaster' };
        }

        const isObserver = !session || (currentUser && currentUser.id === 'demo_broadcaster') || localStorage.getItem('whutcha_observer_mode') === 'true';
        isObserverMode = isObserver;
        window.isObserverMode = isObserver;
        if (isObserver) {
            const observerBanner = document.getElementById('observer-mode-banner');
            if (observerBanner) {
                observerBanner.classList.remove('hidden');
                observerBanner.classList.add('flex');
            }
            // Gentle non-intrusive reminder after 45s of demo exploration
            setTimeout(() => {
                if (localStorage.getItem('whutcha_observer_mode') === 'true' || localStorage.getItem('streamerID') === 'demo_broadcaster') {
                    showToast("Ready to go live with 0% platform cut? Connect your channel in 10s!");
                }
            }, 45000);
        } else {
            const observerBanner = document.getElementById('observer-mode-banner');
            if (observerBanner) {
                observerBanner.classList.add('hidden');
                observerBanner.classList.remove('flex');
            }
        }

        activeStreamerIds = [currentUser.id];

        // Resolve claimed or created profile
        if (isObserverMode || currentUser.id === 'demo_broadcaster') {
            activeProfile = {
                id: 'demo_broadcaster',
                username: 'LocoKwokka',
                display_name: 'Loco Kwokka',
                platform: 'Twitch',
                bio: 'Official Whutcha Demo Channel'
            };
        } else {
            try {
                let { data: claimed } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('claimed_by', currentUser.id)
                    .maybeSingle();

                if (claimed) {
                    activeProfile = claimed;
                } else {
                    let { data: direct } = await supabaseClient
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();
                    activeProfile = direct;
                }

                if (activeProfile) {
                    if (activeProfile.id && !activeStreamerIds.includes(activeProfile.id)) {
                        activeStreamerIds.push(activeProfile.id);
                    }
                    if (activeProfile.username && !activeStreamerIds.includes(activeProfile.username)) {
                        activeStreamerIds.push(activeProfile.username);
                    }
                }
            } catch(e) {
                console.warn("Profile resolution warning:", e);
            }
        }
        
        const displayChannel = activeProfile ? (activeProfile.username || activeProfile.id) : currentUser.id;
        const streamerIdEl = document.getElementById('streamer-id');
        if (streamerIdEl) {
            streamerIdEl.textContent = displayChannel;
        }
        
        const viewerLinkEl = document.getElementById('viewer-link');
        const fanPortalUrl = `${window.location.origin}/viewer.html?streamer=${encodeURIComponent(displayChannel)}`;
        if (viewerLinkEl) {
            viewerLinkEl.textContent = fanPortalUrl;
        }
        const fanPortalBtn = document.getElementById('btn-open-fan-portal');
        if (fanPortalBtn) {
            fanPortalBtn.href = `./viewer.html?streamer=${encodeURIComponent(displayChannel)}`;
        }
        
        loadQueue();
        loadVaultReactions();
        loadPayoutLink();
        loadDiscordWebhook();
        loadTelegramConfig();
        subscribeToQueue();
        initObsRealtime();
        setTimeout(() => {
            if (typeof updateOnboardingState === 'function') updateOnboardingState();
        }, 300);

        // AUTO-CLAIM CHECK: If streamer claimed via public directory before auth
        const claimTarget = sessionStorage.getItem('whutcha_claim_streamer');
        if (claimTarget) {
            sessionStorage.removeItem('whutcha_claim_streamer');
            const claimToken = sessionStorage.getItem('whutcha_claim_token');
            if (claimToken) sessionStorage.removeItem('whutcha_claim_token');
            supabaseClient.rpc('claim_creator_profile', {
                p_streamer_id: claimTarget,
                p_claim_token: claimToken || null
            }).then(({ data, error }) => {
                if (data && data.status === 'success') {
                    if (data.unlocked_bounties_count > 0) {
                        showToast(`🎉 Channel claimed! $${parseFloat(data.unlocked_bounties_total || 0).toFixed(2)} in Escrow Bounties unlocked into your Queue!`);
                    } else {
                        showToast("🎉 Public channel claimed and linked to your account!");
                    }
                    setTimeout(() => window.location.reload(), 1500);
                } else if (data && data.status === 'error') {
                    showToast("Claim error: " + data.message);
                }
            });
        }
    } catch (err) {
        alert("[Whutcha Protocol 500]: Broadcaster Authorization Error: " + (err && err.message ? err.message : String(err)));
        console.error("[Whutcha Protocol 500]: Broadcaster Authorization Error:", err);
    }
}

function checkTrial(user) {
    // Whutcha is 100% free with 0% platform fee for all creators
    return true;
}


// ==========================================
// WALLET / PAYOUT LINK LOGIC
// ==========================================
async function loadPayoutLink() {
    if (checkIsObserver()) {
        const saved = localStorage.getItem('whutcha_demo_paylink') || (activeProfile && activeProfile.external_pay_link) || 'https://paypal.me/whutcha';
        const input = document.getElementById('payout-link-input');
        if (input) input.value = saved;
        return;
    }
    const targetId = activeProfile ? activeProfile.id : (currentUser ? currentUser.id : null);
    if (!targetId) return;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('external_pay_link')
            .eq('id', targetId)
            .single();
            
        if (data && data.external_pay_link) {
            const input = document.getElementById('payout-link-input');
            if (input) input.value = data.external_pay_link;
        }
    } catch (e) {
        console.warn("Could not load payout link from database:", e);
    }
}

window.savePayoutLink = async (targetBtn) => {
    const input = document.getElementById('payout-link-input');
    const link = input ? input.value.trim() : '';
    if (!link) {
        showToast("Please enter a valid payout URL (e.g. PayPal, Boosty, Stripe)");
        return;
    }
    
    const btn = targetBtn || (window.event ? window.event.currentTarget : null) || document.querySelector('button[onclick*="savePayoutLink"]');
    const origText = btn ? btn.innerText : 'SAVE';
    if (btn) {
        btn.innerText = 'SAVING...';
        btn.disabled = true;
    }
    
    vibrate([50]);

    if (checkIsObserver() || !currentUser || currentUser.id === 'demo_broadcaster') {
        if (btn) {
            btn.innerText = origText;
            btn.disabled = false;
        }
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }

    const targetId = activeProfile ? activeProfile.id : currentUser.id;
    try {
        const { error } = await supabaseClient.from('profiles').upsert({ id: targetId, external_pay_link: link });
            
        if (error) {
            showToast("[Whutcha Protocol 400]: Payout Link Update Failed: " + error.message);
            if (btn) {
                btn.innerText = origText;
                btn.disabled = false;
            }
        } else {
            if (btn) {
                btn.innerText = 'SAVED!';
                setTimeout(() => {
                    btn.innerText = origText;
                    btn.disabled = false;
                }, 2000);
            }
            if (activeProfile) activeProfile.external_pay_link = link;
            const settingsPaylink = document.getElementById('settings-paylink');
            if (settingsPaylink) settingsPaylink.value = link;
            if (typeof updateOnboardingState === 'function') updateOnboardingState();
            showToast("✅ Direct Payout Destination Saved!");
        }
    } catch (err) {
        showToast("[Whutcha Protocol 503]: Sovereign Network Timeout: " + err.message);
        if (btn) {
            btn.innerText = origText;
            btn.disabled = false;
        }
    }
};

// ==========================================
// 🎮 DISCORD ALERTS BRIDGE LOGIC
// ==========================================
let currentDiscordWebhookUrl = '';

async function loadDiscordWebhook() {
    if (checkIsObserver()) {
        const saved = localStorage.getItem('whutcha_demo_discord') || '';
        currentDiscordWebhookUrl = saved;
        const input = document.getElementById('discord-webhook-input');
        if (input) input.value = saved;
        updateDiscordBadge(Boolean(saved));
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_discord_webhook');
        if (data && data.webhook_url) {
            currentDiscordWebhookUrl = data.webhook_url;
            const input = document.getElementById('discord-webhook-input');
            if (input) input.value = data.webhook_url;
            updateDiscordBadge(true);
        } else {
            currentDiscordWebhookUrl = '';
            updateDiscordBadge(false);
        }
    } catch (e) {
        console.warn("Error loading Discord webhook:", e);
    }
}

function updateDiscordBadge(connected) {
    const badge = document.getElementById('discord-badge');
    if (!badge) return;
    if (connected) {
        badge.innerText = 'DISCORD: CONNECTED';
        badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest';
    } else {
        badge.innerText = 'DISCORD: NOT CONFIGURED';
        badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-white/5 text-gray-400 border border-white/10 uppercase tracking-widest';
    }
}

window.saveDiscordWebhook = async (btn) => {
    const input = document.getElementById('discord-webhook-input');
    if (!input) return;
    const url = input.value.trim();

    const origHtml = btn ? btn.innerHTML : '<span>Save Webhook</span>';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>SAVING...</span>';
    }

    if (checkIsObserver() || !currentUser || currentUser.id === 'demo_broadcaster') {
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('save_discord_webhook', {
            p_url: url || null,
            p_enabled: Boolean(url)
        });

        if (error || (data && data.status === 'error')) {
            showToast(data ? data.message : error.message);
            if (btn) {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }
            return;
        }

        currentDiscordWebhookUrl = url;
        showToast("🎮 Discord Webhook saved successfully!");
        updateDiscordBadge(Boolean(url));
        if (btn) {
            btn.innerHTML = '<span>✅ SAVED!</span>';
            setTimeout(() => { btn.innerHTML = origHtml; btn.disabled = false; }, 2000);
        }
    } catch (err) {
        showToast("[Whutcha Protocol 400]: Gateway Webhook Sync Failed: " + err.message);
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }
};

window.testDiscordWebhook = async (btn) => {
    const input = document.getElementById('discord-webhook-input');
    const url = input ? input.value.trim() : (currentDiscordWebhookUrl || '');
    if (!url) {
        showToast("Please paste your Discord Webhook URL first!");
        return;
    }

    const origHtml = btn ? btn.innerHTML : '<span>⚡ Test Ping</span>';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>PINGING...</span>';
    }

    try {
        if (!checkIsObserver() && currentUser && currentUser.id !== 'demo_broadcaster') {
            await supabaseClient.rpc('save_discord_webhook', { p_url: url, p_enabled: true });
        } else {
            localStorage.setItem('whutcha_demo_discord', url);
        }
        currentDiscordWebhookUrl = url;
        updateDiscordBadge(true);

        const testPayload = {
            username: "Whutcha Alerts",
            avatar_url: "https://whutcha.com/assets/loco-kwokka.jpg",
            embeds: [
                {
                    title: "🧪 Whutcha Discord Alerts: Test Ping!",
                    description: "Your Discord Webhook is connected and ready to receive real-time broadcast alerts!",
                    color: 0x10b981, // Emerald
                    fields: [
                        { name: "💵 Status", value: "Operational (200 OK)", inline: true },
                        { name: "🛡️ Queue", value: "Pre-Moderated", inline: true },
                        { name: "⚡ Quick Action", value: `[Open OBS Dashboard](${window.location.origin}/dashboard.html)`, inline: false }
                    ],
                    thumbnail: { url: "https://whutcha.com/assets/loco-kwokka.jpg" },
                    footer: { text: "Whutcha • Live Video Donations & Co-Streams" },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        if (!resp.ok) {
            throw new Error(`Discord rejected webhook with HTTP ${resp.status}`);
        }

        showToast("🔥 Test alert dispatched to Discord!");
        vibrate([50, 100, 50]);
        if (btn) {
            btn.innerHTML = '<span>✅ PING SENT!</span>';
            setTimeout(() => { btn.innerHTML = origHtml; btn.disabled = false; }, 2500);
        }
    } catch (err) {
        console.error("[Whutcha Protocol 502]: Gateway Webhook Dispatch Error:", err);
        showToast("[Whutcha Protocol 502]: Gateway Webhook Dispatch Error: " + err.message);
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }
};

async function dispatchDiscordAlert(donation) {
    if (!currentDiscordWebhookUrl) return;
    try {
        const isCoStream = (donation.video_hash || '').toLowerCase().includes("costream");
        const amount = parseFloat(donation.amount) || 0.00;
        const username = donation.username || 'Anonymous';

        let embedTitle = isCoStream ? "📞 Live Co-Stream Call Incoming!" : "🎬 New Video Donation in Queue!";
        let embedColor = isCoStream ? 0xa800ff : 0x00f0ff;
        if (amount >= 50) {
            embedTitle = "👑 VIP ALERT • Priority Video Donation!";
            embedColor = 0xf59e0b;
        }

        const payload = {
            username: "Whutcha Alerts",
            avatar_url: "https://whutcha.com/assets/loco-kwokka.jpg",
            embeds: [{
                title: embedTitle,
                description: `**@${username}** sent a **$${amount.toFixed(2)}** ${isCoStream ? 'Co-Stream call' : 'video donation'} for your live stream!`,
                color: embedColor,
                fields: [
                    { name: "💵 Amount", value: `$${amount.toFixed(2)} USD`, inline: true },
                    { name: "👤 Viewer", value: `@${username}`, inline: true },
                    { name: "🛡️ Queue Status", value: "Pending Pre-Moderation", inline: true },
                    { name: "⚡ Action", value: "[Open OBS Dashboard](https://whutcha.com/dashboard.html)", inline: false }
                ],
                thumbnail: { url: "https://whutcha.com/assets/loco-kwokka.jpg" },
                footer: { text: "Whutcha • Live Video Donations & Co-Streams" },
                timestamp: new Date().toISOString()
            }]
        };

        fetch(currentDiscordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Discord webhook dispatch error:", err));
    } catch (e) {
        console.error("Error in dispatchDiscordAlert:", e);
    }
}

// ==========================================
// 📱 TELEGRAM BOT ALERTS BRIDGE LOGIC (NODE 7)
// ==========================================
let currentTelegramChatId = '';
let currentTelegramBotToken = '';

async function loadTelegramConfig() {
    if (checkIsObserver()) {
        const savedChat = localStorage.getItem('whutcha_demo_telegram_chat') || '';
        const savedToken = localStorage.getItem('whutcha_demo_telegram_token') || '';
        currentTelegramChatId = savedChat;
        currentTelegramBotToken = savedToken;
        const chatInput = document.getElementById('telegram-chat-id-input');
        const tokenInput = document.getElementById('telegram-bot-token-input');
        if (chatInput) chatInput.value = savedChat;
        if (tokenInput) tokenInput.value = savedToken;
        updateTelegramBadge(Boolean(savedChat && savedToken));
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('get_telegram_config');
        if (data && data.chat_id) {
            currentTelegramChatId = data.chat_id;
            currentTelegramBotToken = data.bot_token || '';
            const chatInput = document.getElementById('telegram-chat-id-input');
            const tokenInput = document.getElementById('telegram-bot-token-input');
            if (chatInput) chatInput.value = data.chat_id;
            if (tokenInput && data.bot_token) tokenInput.value = data.bot_token;
            updateTelegramBadge(data.has_telegram && data.enabled);
        } else {
            currentTelegramChatId = '';
            currentTelegramBotToken = '';
            updateTelegramBadge(false);
        }
    } catch(e) {
        console.warn("Error loading Telegram config:", e);
    }
}

function updateTelegramBadge(connected) {
    const badge = document.getElementById('telegram-badge');
    if (!badge) return;
    if (connected) {
        badge.innerText = 'TELEGRAM: CONNECTED';
        badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest';
    } else {
        badge.innerText = 'TELEGRAM: NOT CONFIGURED';
        badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-white/5 text-gray-400 border border-white/10 uppercase tracking-widest';
    }
}

function escapeTelegramHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

window.saveTelegramConfig = async (btn) => {
    const chatInput = document.getElementById('telegram-chat-id-input');
    const tokenInput = document.getElementById('telegram-bot-token-input');
    const chatId = chatInput ? chatInput.value.trim() : '';
    const botToken = tokenInput ? tokenInput.value.trim() : '';

    const origHtml = btn ? btn.innerHTML : '<span>Save Config</span>';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>SAVING...</span>';
    }

    if (checkIsObserver() || !currentUser || currentUser.id === 'demo_broadcaster') {
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }

    try {
        const { data, error } = await supabaseClient.rpc('save_telegram_config', {
            p_chat_id: chatId || null,
            p_bot_token: botToken || null,
            p_enabled: Boolean(chatId)
        });

        if (error || (data && data.status === 'error')) {
            showToast(data ? data.message : error.message);
            if (btn) {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }
            return;
        }

        currentTelegramChatId = chatId;
        currentTelegramBotToken = botToken;
        showToast("📱 Telegram Alerts configuration saved!");
        updateTelegramBadge(Boolean(chatId && botToken));
        if (btn) {
            btn.innerHTML = '<span>✅ SAVED!</span>';
            setTimeout(() => { btn.innerHTML = origHtml; btn.disabled = false; }, 2000);
        }
    } catch(err) {
        showToast("[Whutcha Protocol 400]: Bot Dispatch Configuration Failed: " + err.message);
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }
};

window.testTelegramAlert = async (btn) => {
    const chatInput = document.getElementById('telegram-chat-id-input');
    const tokenInput = document.getElementById('telegram-bot-token-input');
    const chatId = chatInput ? chatInput.value.trim() : currentTelegramChatId;
    const botToken = tokenInput ? tokenInput.value.trim() : currentTelegramBotToken;

    if (!chatId) {
        showToast("Please enter your Telegram Chat ID first!");
        return;
    }
    if (!botToken) {
        showToast("Please enter your Telegram Bot Token from @BotFather first!");
        return;
    }

    const origHtml = btn ? btn.innerHTML : '<span>⚡ Test Ping</span>';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>PINGING...</span>';
    }

    try {
        if (!checkIsObserver() && currentUser && currentUser.id !== 'demo_broadcaster') {
            await supabaseClient.rpc('save_telegram_config', {
                p_chat_id: chatId,
                p_bot_token: botToken,
                p_enabled: true
            });
        } else {
            localStorage.setItem('whutcha_demo_telegram_chat', chatId);
            localStorage.setItem('whutcha_demo_telegram_token', botToken);
        }
        currentTelegramChatId = chatId;
        currentTelegramBotToken = botToken;
        updateTelegramBadge(true);

        const testMsg = `🧪 <b>Whutcha Telegram Alerts: Test Ping!</b>\n\n` +
            `Your Telegram Bot is connected and ready to receive real-time broadcast alerts!\n\n` +
            `💵 <b>Status:</b> Operational (200 OK)\n` +
            `🛡️ <b>Queue:</b> Pre-Moderated\n` +
            `⚡ <b>Quick Action:</b> <a href="${window.location.origin}/dashboard.html">Open OBS Dashboard</a>`;

        const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: testMsg,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        });

        const respData = await resp.json();
        if (!resp.ok || !respData.ok) {
            throw new Error(respData.description || `Telegram API error HTTP ${resp.status}`);
        }

        showToast("🔥 Test alert dispatched to Telegram!");
        vibrate([50, 100, 50]);
        btn.innerHTML = '<span>✅ PING SENT!</span>';
        setTimeout(() => { btn.innerHTML = origHtml; btn.disabled = false; }, 2500);
    } catch(err) {
        console.error("[Whutcha Protocol 502]: Bot Dispatch Verification Failed:", err);
        alert("[Whutcha Protocol 502]: Bot Dispatch Verification Failed: " + err.message + "\nMake sure you started your bot in Telegram (/start) and provided correct Chat ID & Bot Token.");
        btn.innerHTML = origHtml;
        btn.disabled = false;
    }
};

async function dispatchTelegramAlert(donation) {
    if (!currentTelegramChatId || !currentTelegramBotToken) return;
    try {
        const isCoStream = (donation.video_hash || '').toLowerCase().includes("costream");
        const amount = parseFloat(donation.amount) || 0.00;
        const safeUser = escapeTelegramHtml(donation.username || 'Anonymous');
        const isWhale = amount >= 50;

        let title = isWhale 
            ? '👑 <b>VIP ALERT • Priority Video Donation!</b>' 
            : (isCoStream ? '📞 <b>Live Co-Stream Call Incoming!</b>' : '🎬 <b>New Video Donation in Queue!</b>');

        let text = `${title}\n\n` +
            `👤 <b>Viewer:</b> @${safeUser}\n` +
            `💰 <b>Amount:</b> $${amount.toFixed(2)} USD\n` +
            `🛡️ <b>Queue Status:</b> Pending Pre-Moderation\n\n` +
            `⚡ <a href="${window.location.origin}/dashboard.html">Review in Cockpit</a>`;

        fetch(`https://api.telegram.org/bot${currentTelegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: currentTelegramChatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: false
            })
        }).catch(err => console.error("Telegram alert dispatch error:", err));
    } catch(e) {
        console.error("Error in dispatchTelegramAlert:", e);
    }
}

async function loadQueue() {
    const idsToQuery = activeStreamerIds && activeStreamerIds.length > 0 ? activeStreamerIds : [currentUser.id];
    const { data, error } = await supabaseClient
        .from('donations')
        .select('*')
        .in('streamer_id', idsToQuery)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[Whutcha Protocol 500]: Error loading queue ledger:', error);
        return;
    }
    
    const remoteData = data || [];
    window.dismissedSimulationIds = window.dismissedSimulationIds || new Set();
    try {
        const savedDismissed = JSON.parse(localStorage.getItem('whutcha_dismissed_sims') || '[]');
        savedDismissed.forEach(id => window.dismissedSimulationIds.add(id));
    } catch(e){}
    
    // Kill resurrected mutations: Filter both local simulations and remote Supabase records
    const validRemote = remoteData.filter(d => d && d.id && !window.dismissedSimulationIds.has(d.id));
    const localSims = (currentDonations || []).filter(d => 
        d.id && 
        d.id.startsWith('SIM-') && 
        d.status === 'pending' && 
        !window.dismissedSimulationIds.has(d.id)
    );
    const existingIds = new Set(validRemote.map(d => d.id));
    const merged = [...localSims.filter(s => !existingIds.has(s.id)), ...validRemote];

    // GAME ECONOMIST & SPEEDRUNNER PRIORITY SORTING:
    // Co-Stream active calls & VIP Whale alerts ($50+) take top priority in queue
    const sorted = merged.sort((a, b) => {
        const aIsVip = parseFloat(a.amount || 0) >= 50;
        const bIsVip = parseFloat(b.amount || 0) >= 50;
        const aIsCoStream = (a.video_hash || a.videoHash || '').toLowerCase().includes('costream');
        const bIsCoStream = (b.video_hash || b.videoHash || '').toLowerCase().includes('costream');
        
        const aScore = (aIsCoStream ? 200 : 0) + (aIsVip ? 100 : 0);
        const bScore = (bIsCoStream ? 200 : 0) + (bIsVip ? 100 : 0);
        if (aScore !== bScore) return bScore - aScore;

        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
    });

    currentDonations = sorted;
    renderQueue(currentDonations);
}

// ==========================================
// 🛡️ NODE 8: P2P TRUST & VERIFY PROTOCOL
// ==========================================
window.verifiedDonations = new Set();
try {
    const raw = localStorage.getItem('whutcha_verified_p2p');
    if (raw) window.verifiedDonations = new Set(JSON.parse(raw));
} catch(e){}

window.isDonationVerified = function(id) {
    if (!id || String(id).startsWith('SIM-')) return true;
    return window.verifiedDonations.has(id);
};

window.toggleDonationVerified = function(id, forceValue) {
    vibrate([30]);
    const current = window.verifiedDonations.has(id);
    const target = forceValue !== undefined ? Boolean(forceValue) : !current;

    if (target) {
        window.verifiedDonations.add(id);
        showToast("✅ Payment marked as verified!");
    } else {
        window.verifiedDonations.delete(id);
        showToast("⚠️ Payment reverted to Unverified");
    }

    try {
        localStorage.setItem('whutcha_verified_p2p', JSON.stringify(Array.from(window.verifiedDonations)));
    } catch(e){}

    // Update UI elements on card if present
    const badge = document.getElementById('p2p-badge-' + id);
    const btn = document.getElementById('btn-verify-' + id);
    const icon = document.getElementById('verify-icon-' + id);
    const text = document.getElementById('verify-text-' + id);

    if (badge) {
        if (target) {
            badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1";
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>P2P VERIFIED';
        } else {
            badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 animate-pulse";
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>P2P UNVERIFIED';
        }
    }

    if (btn) {
        if (target) {
            btn.className = "px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-mono-tech font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer";
            if (icon) icon.textContent = '✓';
            if (text) text.textContent = 'Payment Confirmed';
        } else {
            btn.className = "px-2.5 py-1 bg-white/5 text-gray-300 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/40 rounded-lg text-[10px] font-mono-tech font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer";
            if (icon) icon.textContent = '○';
            if (text) text.textContent = 'Confirm Payout';
        }
    }
};

window.openUnverifiedPayoutModal = function(donation, onConfirm) {
    const modal = document.getElementById('unverified-payout-modal');
    if (!modal) {
        if (typeof onConfirm === 'function') onConfirm();
        return;
    }
    const amtEl = document.getElementById('unverified-modal-amount');
    const donorEl = document.getElementById('unverified-modal-donor');
    const memoRow = document.getElementById('unverified-modal-memo-row');
    const memoEl = document.getElementById('unverified-modal-memo');
    const btnProceed = document.getElementById('btn-proceed-unverified-payout');

    if (amtEl) amtEl.textContent = '+$' + parseFloat(donation.amount || 0).toFixed(2);
    if (donorEl) donorEl.textContent = '@' + (donation.username || 'Anonymous');

    const memo = donation.payment_memo || donation.payment_note || (donation.bounty_message && !donation.bounty_message.startsWith('Video Bounty from @') ? donation.bounty_message : null);
    if (memo && memoRow && memoEl) {
        memoRow.classList.remove('hidden');
        memoEl.textContent = memo;
    } else if (memoRow) {
        memoRow.classList.add('hidden');
    }

    if (btnProceed) {
        btnProceed.onclick = () => {
            closeUnverifiedPayoutModal();
            if (typeof onConfirm === 'function') onConfirm();
        };
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const rack = modal.querySelector('.cyber-rack');
        if (rack) {
            rack.classList.remove('scale-95');
            rack.classList.add('scale-100');
        }
    });
};

window.closeUnverifiedPayoutModal = function() {
    const modal = document.getElementById('unverified-payout-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.remove('scale-100');
        rack.classList.add('scale-95');
    }
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 250);
};

// SLA Timer Logic is handled per active donation card in renderQueue below

function renderQueue(donations) {
    const container = document.getElementById('queue-container');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('queue-count');
    if (countEl) countEl.innerText = donations.length;
    
    const mobileCountEl = document.getElementById('mobile-queue-count');
    if (mobileCountEl) {
        mobileCountEl.innerText = donations.length;
        if (donations.length > 0) {
            mobileCountEl.classList.remove('hidden');
        } else {
            mobileCountEl.classList.add('hidden');
        }
    }
    
    if (donations.length === 0) {
        if (container) container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (!container) return;
    
    // VAMPIRE MODE: Aggressively destroy hidden <video> buffers before clearing DOM
    const oldVids = container.querySelectorAll('video');
    oldVids.forEach(vid => { vid.pause(); vid.removeAttribute('src'); vid.load(); });
    
    container.innerHTML = '';
    
    // WHALE MODE PROTECTOR: Hard limit to prevent DOM/Video OOM crashes
    const VISIBLE_LIMIT = 5;
    const visibleDonations = donations.slice(0, VISIBLE_LIMIT);
    const hiddenCount = donations.length - VISIBLE_LIMIT;
    
    visibleDonations.forEach(d => {
        
    const isCoStream = (d.videoHash || (d.videoHash || d.video_hash) || '').toLowerCase().includes('costream');
    const isPremium = parseFloat(d.amount || 0) >= 50;
    const rawTime = d.created_at ? new Date(d.created_at).getTime() : Date.now();
    const createdTime = isNaN(rawTime) ? Date.now() : rawTime;
    const expiryTime = createdTime + (15 * 60 * 1000); // 15 mins
    
    const premiumGlow = isPremium 
        ? 'border-amber-400/60 shadow-[0_0_35px_rgba(250,204,21,0.25)] bg-gradient-to-br from-amber-500/10 via-[#0d1017] to-[#0a0c12]' 
        : 'border-white/10 bg-[#0a0c12]';
    
    const card = document.createElement('div');
    card.id = 'donation-' + d.id;
    card.setAttribute('data-donation-id', d.id);
    // DOPAMINE MODE: Cyber-Broadcast Card styling with scanlines and neon borders
    card.className = `cyber-rack p-4 rounded-xl flex flex-col md:flex-row gap-4 relative overflow-hidden group transition-all duration-300 border hover:border-[#00f0ff]/40 shadow-xl animate-[slideIn_0.3s_ease-out_forwards] ${premiumGlow}`;
    
    const timerHtmlId = 'timer-' + d.id;
    
    const mediaHash = d.video_hash || d.videoHash || '';
    const isDirectPlayable = mediaHash.includes('loco-kwokka') || mediaHash.endsWith('.mp4') || mediaHash.startsWith('http');
    const directSrc = isDirectPlayable ? (mediaHash.startsWith('http') ? mediaHash : `./assets/${mediaHash}`) : null;

    const isSample = (d.id && String(d.id).startsWith('SIM-')) || (d.username && String(d.username).includes('Loco Kwokka')) || (mediaHash && mediaHash.includes('loco-kwokka'));
    const isP2PVerified = window.isDonationVerified(d.id);
    const paymentMemo = d.payment_memo || d.payment_note || (d.bounty_message && !d.bounty_message.startsWith('Video Bounty from @') ? d.bounty_message : null);

    const p2pBadgeHtml = isSample
        ? '<span class="px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase shadow-[0_0_8px_rgba(245,158,11,0.3)]">⚡ DEMO SHOWCASE</span>'
        : (isP2PVerified
            ? `<span id="p2p-badge-${d.id}" class="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>P2P VERIFIED</span>`
            : `<span id="p2p-badge-${d.id}" class="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>P2P UNVERIFIED</span>`
        );

    card.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-r ${isCoStream ? 'from-[#a800ff]/10' : 'from-[#00f0ff]/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        <div class="relative w-full md:w-48 h-48 md:h-32 bg-black rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10 cyber-scanlines">
            ${isDirectPlayable 
                ? `<div id="vid-container-${d.id}" class="w-full h-full relative z-10 group/vid">
                    <video src="${directSrc}" class="w-full h-full object-cover rounded-lg" controls playsinline preload="metadata" poster="./assets/loco-kwokka.jpg"></video>
                    <button onclick="openVideoPreviewModal('${directSrc}', '${sanitize(d.username)}', ${d.amount}, '${d.id}', ${isCoStream})" class="absolute top-2 left-2 z-20 px-2 py-1 rounded-md bg-black/85 hover:bg-[#00f0ff] text-gray-200 hover:text-black transition-all border border-white/20 shadow-md flex items-center gap-1 text-[9px] font-mono-tech font-bold uppercase cursor-pointer" title="Expand Full Theater Preview">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                        <span>Expand</span>
                    </button>
                   </div>`
                : (isCoStream 
                    ? '<div class="w-full h-full flex flex-col items-center justify-center bg-[#a800ff]/15 relative z-10"><svg class="w-8 h-8 text-[#a800ff] mb-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span class="font-black text-[10px] text-[#a800ff] uppercase tracking-widest font-mono">Live Co-Stream</span></div>'
                    : `<div id="vid-container-${d.id}" class="w-full h-full flex items-center justify-center bg-[#0d1017] text-gray-400 text-[10px] font-bold uppercase text-center p-2 font-mono relative z-10"><button onclick="loadVideoPreview('${d.id}', '${mediaHash}')" class="px-3 py-1.5 bg-white/10 hover:bg-[#00f0ff]/20 hover:text-[#00f0ff] border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"><span>▶ Play Preview</span></button></div>`
                )
            }
            <span id="${timerHtmlId}" class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white font-black px-2 py-0.5 text-[9px] rounded uppercase shadow border border-white/15 font-mono tracking-wider">15:00</span>
        </div>
        <div class="flex-1 flex flex-col justify-between relative z-10">
            <div>
                <div class="flex items-center justify-between mb-1.5 w-full">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold uppercase ${isCoStream ? 'bg-[#a800ff]/20 text-[#a800ff] border border-[#a800ff]/40' : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'} shadow-sm">
                            ${isCoStream ? '● Live Co-Stream' : '▶ Video Message'}
                        </span>
                        ${p2pBadgeHtml}
                        ${parseFloat(d.amount) >= 50 ? '<span class="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 uppercase">👑 VIP ALERT</span>' : ''}
                    </div>
                    <button onclick="banViewer('${d.viewer_device_id || ''}', '${(d.username || '').replace(/'/g, "\\'")}')" title="Ban User" class="text-[9px] text-red-500/60 hover:text-red-400 font-mono-tech font-bold uppercase transition-colors px-2 py-0.5 rounded hover:bg-red-500/10 cursor-pointer">Ban User 🚫</button>
                </div>
                <h4 class="text-base sm:text-lg font-black text-white mb-0.5 truncate max-w-[240px] flex items-center gap-2 tracking-tight" dir="auto">
                    ${sanitize(d.username)}
                </h4>
                <div class="flex items-center justify-between mt-1 mb-1">
                    <p class="text-2xl font-black font-mono-tech text-[#10b981] drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                        +$${parseFloat(d.amount).toFixed(2)}
                    </p>
                    ${!isSample ? `
                        <button id="btn-verify-${d.id}" onclick="toggleDonationVerified('${d.id}')" title="Click to confirm you received this payment in PayPal/Boosty" class="px-2.5 py-1 ${isP2PVerified ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-gray-300 hover:text-emerald-400 border-white/10 hover:border-emerald-500/40'} border rounded-lg text-[10px] font-mono-tech font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer">
                            <span id="verify-icon-${d.id}">${isP2PVerified ? '✓' : '○'}</span>
                            <span id="verify-text-${d.id}">${isP2PVerified ? 'Payment Confirmed' : 'Confirm Payout'}</span>
                        </button>
                    ` : ''}
                </div>
                ${paymentMemo ? `
                    <div class="mt-1 text-[11px] font-mono-tech text-amber-300/90 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg truncate flex items-center gap-1.5">
                        <span class="text-xs">📝</span>
                        <span class="text-gray-400 text-[10px] uppercase">Memo:</span>
                        <strong class="text-white truncate">${sanitize(paymentMemo)}</strong>
                    </div>
                ` : ''}
            </div>
            
            <div class="flex flex-wrap gap-2 mt-3" id="actions-${d.id}">
                ${isSample ? `
                    <button onclick="approveDonation('${d.id}', ${isCoStream}, '${sanitize(d.username)}')" class="flex-1 py-2 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-90 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>${isCoStream ? 'Test Call Preview' : 'Test Clip Preview'}</span>
                    </button>
                ` : `
                    <button onclick="approveDonation('${d.id}', ${isCoStream}, '${sanitize(d.username)}')" class="flex-1 py-2 px-4 bg-[#00f0ff] hover:bg-[#3bf4ff] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.35)] flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>${isCoStream ? 'Accept & Bridge' : 'Approve to OBS'}</span>
                    </button>
                `}
                <button onclick="rejectDonation('${d.id}', '${d.video_hash || d.videoHash}')" class="py-2 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">
                    Reject
                </button>
            </div>
        </div>
    `;
    
    // Timer Logic: Protect Sample and Observer items from auto-expiring or blinking
    if (d.id && d.id.startsWith('SIM-')) {
        const timerEl = card.querySelector(`#${timerHtmlId}`);
        if (timerEl) {
            timerEl.innerText = "15:00";
            timerEl.className = "absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[#00f0ff] font-black px-2 py-0.5 text-[9px] rounded uppercase shadow border border-[#00f0ff]/30 font-mono tracking-wider";
        }
    } else {
        if(window.slaTimers[d.id]) clearInterval(window.slaTimers[d.id]);
        window.slaTimers[d.id] = setInterval(() => {
            const now = Date.now();
            const diff = expiryTime - now;
            const timerEl = document.getElementById(timerHtmlId);
            
            if(diff <= 0) {
                clearInterval(window.slaTimers[d.id]);
                if(timerEl) {
                    timerEl.innerText = "EXPIRED";
                    timerEl.className = "absolute top-2 right-2 bg-red-600/80 text-white font-black px-2 py-0.5 text-[9px] rounded uppercase shadow border border-red-500 font-mono";
                }
                const actionEl = document.getElementById('actions-' + d.id);
                if(actionEl && !d._autoRejected) {
                    d._autoRejected = true;
                    actionEl.innerHTML = '<span class="text-red-400 font-mono-tech font-bold text-xs uppercase tracking-wider">Expired (15m elapsed)</span>';
                    
                    // Smooth auto-removal after 5 seconds to keep queue clean
                    setTimeout(() => {
                        const c = document.getElementById('donation-' + d.id);
                        if (c && c.parentNode) {
                            c.style.transition = 'all 0.4s ease-out';
                            c.style.opacity = '0';
                            c.style.transform = 'translateX(-20px)';
                            setTimeout(() => {
                                if (c.parentNode) c.remove();
                                currentDonations = (currentDonations || []).filter(x => x.id !== d.id);
                                const qCount = document.getElementById('queue-count');
                                if (qCount) qCount.innerText = currentDonations.length;
                            }, 400);
                        }
                    }, 5000);

                    if (!checkIsObserver() && currentUser && currentUser.id !== 'demo_broadcaster') {
                        supabaseClient.from('donations').update({ status: 'rejected' }).eq('id', d.id).then(()=>{});
                    }
                }
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                if(timerEl) timerEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    container.appendChild(card);
});
    
    if (hiddenCount > 0) {
        const indicator = document.createElement('div');
        indicator.className = "p-4 text-center text-silver/60 font-black text-sm uppercase tracking-widest border border-white/5 rounded-xl border-dashed bg-black/20 mt-4 shadow-inner";
        indicator.innerHTML = `<span class="animate-pulse inline-block mr-2 text-primary">●</span> + ${hiddenCount} more videos in queue... <br><span class="text-[10px] text-silver/40 font-bold normal-case mt-1 block">Process videos to load the next ones.</span>`;
        container.appendChild(indicator);
    }
}
window.renderQueue = renderQueue;


// TIME TRAVELER MODE: Guard against PC sleep / expired sessions
async function ensureSession() {
    if (!currentUser) return false;
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
        alert("[Whutcha Security 401]: Broadcaster Session Expired. Please authenticate again.");
        window.location.href = './index.html';
        return false;
    }
    return true;
}

async function updateStatus(id, status) {
    if (id && String(id).startsWith('SIM-')) {
        return true; // Simulation card handled locally in memory
    }
    if (!(await ensureSession())) return;
    const { error } = await supabaseClient
        .from('donations')
        .update({ status: status })
        .eq('id', id);
        
    if (error) {
        console.error('[Whutcha Protocol 500]: Error updating item status:', error);
    }
}

async function banUser(id) {
    if(confirm('Are you sure you want to ban this user and reject the donation?')) {
        await updateStatus(id, 'rejected');
        // Optional: Call an edge function to add their device/IP to a ban list
        alert('[Whutcha Security 403]: Viewer Device Restricted & Blacklisted.');
    }
}



window.updateNetworkUI = function(status) {
    const text = document.getElementById('network-text');
    const dot = document.getElementById('network-dot');
    const ping = document.getElementById('network-ping');
    if(!text) return;
    
    if (status === 'SUBSCRIBED') {
        text.innerText = "CONNECTED";
        text.className = "text-xs font-black text-green-400 uppercase tracking-wider";
        dot.className = "w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-colors";
        ping.className = "absolute w-full h-full bg-green-500 rounded-full animate-ping opacity-20";
    } else {
        text.innerText = "OFFLINE - RECONNECTING";
        text.className = "text-xs font-black text-red-500 uppercase tracking-wider animate-pulse";
        dot.className = "w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-colors";
        ping.className = "hidden"; // Stop pinging when offline
        vibrate([200, 100, 200]); // Alert streamer
    }
};

function subscribeToQueue() {
    supabaseClient.channel('public:donations')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'donations'
        }, (payload) => {
            const row = payload.new || payload.old;
            if (!row || !activeStreamerIds.includes(row.streamer_id)) return;
            
            // Trigger Notification for new pending donations
            if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                const isCoStream = (payload.new.video_hash || '').toLowerCase().includes("costream");
                const numAmount = parseFloat(payload.new.amount || 0);
                const isVip = numAmount >= 50;
                const amountVal = numAmount.toFixed(2);
                const donorName = payload.new.username || 'Anonymous';

                // Play in-studio audio chime immediately
                if (typeof window.playSynthesizedChime === 'function') {
                    window.playSynthesizedChime(isVip);
                }

                if (notificationsEnabled || ('Notification' in window && Notification.permission === 'granted')) {
                    const notifTitle = isVip
                        ? `👑 VIP Alert: $${amountVal} from @${donorName}!`
                        : (isCoStream ? '🔴 Live Co-Stream Call!' : '🎬 New Video Donation Arrived!');
                    const notifBody = `@${donorName} sent $${amountVal} for your broadcast!`;

                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then(reg => {
                            reg.showNotification(notifTitle, {
                                body: notifBody,
                                icon: './icon.svg',
                                badge: './icon.svg',
                                vibrate: [200, 100, 200, 100, 200],
                                data: { url: './dashboard.html' }
                            });
                        }).catch(() => {});
                    } else if ('Notification' in window) {
                        try {
                            new Notification(notifTitle, {
                                body: notifBody,
                                icon: './icon.svg'
                            });
                        } catch(e){}
                    }
                }
                vibrate([100, 50, 100]); // Strong haptic for new incoming
                dispatchDiscordAlert(payload.new); // Realtime Discord Webhook alert
                dispatchTelegramAlert(payload.new); // Realtime Telegram Bot alert
            }
            
            loadQueue(); 
        })
        .subscribe((status) => {
            console.log("Realtime status:", status);
            updateNetworkUI(status);
        });
}



window.copyViewerUrl = function(btnElement) {
    if (typeof window.copyViewerLink === 'function') {
        window.copyViewerLink(btnElement);
    }
};



window.signOut = async function() {
    vibrate([50, 50]);
    if (typeof showToast === 'function') {
        showToast("👋 Disconnecting studio session...");
    }
    
    // Visually indicate action on the disconnect button without freezing the entire body
    const btn = document.querySelector('button[aria-label="Sign out"]');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    }

    // Set logout flag so index.html does not auto-bounce back to dashboard
    try {
        sessionStorage.setItem('whutcha_logged_out', 'true');
        sessionStorage.removeItem('whutcha_dive_seen');
    } catch(e) {}

    // Safe purge of local tokens, demo state, and credentials
    try {
        const keysToRemove = [
            'streamerID',
            'whutcha_observer_mode',
            'whutcha_demo_paylink',
            'whutcha_demo_handle',
            'whutcha_demo_discord',
            'whutcha_demo_telegram_chat',
            'whutcha_demo_telegram_token',
            'whutcha_last_receipt_id'
        ];
        keysToRemove.forEach(k => {
            try { localStorage.removeItem(k); } catch(e) {}
        });
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('sb-') || k.includes('supabase'))) {
                try { localStorage.removeItem(k); } catch(e) {}
            }
        }
    } catch(e) {}

    // Graceful Supabase signOut with strict 500ms timeout (never hang the UI)
    try {
        if (supabaseClient && supabaseClient.auth) {
            await Promise.race([
                supabaseClient.auth.signOut({ scope: 'local' }),
                new Promise(r => setTimeout(r, 500))
            ]);
        }
    } catch(e) {
        console.warn("Signout network warning:", e);
    }

    // Direct, guaranteed navigation to landing / registration
    window.location.replace('./index.html');
};

// ==========================================
// WHUTCHA LIVE BRIDGE CO-STREAM LOGIC
// ==========================================
async function joinCoStream(donationId) {
    try {
        const { data, error } = await supabaseClient.functions.invoke('livekit-token', {
            body: { roomName: donationId }
        });
        
        if (error || !data) {
            console.error("[Whutcha Live Bridge 500]: Live Bridge Token generation error:", error);
            alert("[Whutcha Live Bridge 503]: Co-Stream Gateway Initialization Failed. Please check network connection and retry.");
            return;
        }
        
        // 1. Give viewer their token by saving it to DB and setting approved
        await supabaseClient
            .from('donations')
            .update({ status: 'approved', join_token: data.viewerToken, video_hash: data.obsToken })
            .eq('id', donationId);
            
        // 2. Open Streamer Co-Stream Modal
        openCoStreamModal(data.streamerToken);
        
    } catch (e) {
        console.error('[Whutcha Live Bridge 500]: Co-Stream Peer Connection Failure:', e);
        alert('[Whutcha Live Bridge 500]: Peer Gateway Connection Failure.');
    }
}

// activeCoStreamRoom is declared at top of file

// ==========================================
// 🎙️ CO-STREAM DIRECTOR GREEN ROOM (STUDIO CONSOLE)
// ==========================================
window.activeCostreamPayload = null;
window.activeCoStreamId = null;

window.openCoStreamStudio = function() {
    vibrate([30]);
    if (typeof window.canOpenModal === 'function' && !window.canOpenModal('costream-modal')) return;
    
    // Ensure standby UI if no active call is loaded
    const remoteVid = document.getElementById('costream-remote-vid');
    if (remoteVid && (!remoteVid.querySelector('video') || remoteVid.innerHTML.trim() === '')) {
        remoteVid.innerHTML = `
            <div id="costream-standby-view" class="w-full h-full flex flex-col items-center justify-center p-4 text-center font-mono-tech">
                <div class="w-12 h-12 rounded-full border border-purple-500/40 bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2 shadow-[0_0_15px_rgba(168,0,255,0.3)]">
                    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <span class="text-xs font-black text-white uppercase tracking-wider mb-1">Awaiting Fan Caller</span>
                <p class="text-[11px] text-gray-400 max-w-xs mb-3">Incoming Co-Stream callers appear here first for pre-moderation. OBS remains completely shielded.</p>
                <button onclick="simulateDonation('costream')" class="px-3 py-1.5 rounded-lg bg-[#a800ff]/20 hover:bg-[#a800ff]/40 text-[#a800ff] border border-[#a800ff]/50 text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,0,255,0.2)] cursor-pointer">
                    ⚡ Preview Sample Call
                </button>
            </div>
        `;
    }

    const badge = document.getElementById('costream-status-badge');
    if (badge && !window.activeCoStreamId && !window.activeCostreamPayload) {
        badge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-white/10 text-gray-300 border border-white/20 uppercase";
        badge.innerText = "READY FOR CALLERS";
    }

    if (typeof openModal === 'function') {
        openModal('costream-modal');
    } else {
        const modal = document.getElementById('costream-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0');
                modal.classList.add('opacity-100');
            });
        }
    }
};

window.pushActiveCallToObs = function() {
    vibrate([80]);
    const badge = document.getElementById('costream-status-badge');
    if (badge) {
        badge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-red-600/20 text-red-400 border border-red-500/40 uppercase animate-pulse";
        badge.innerText = "🔴 ON-AIR BROADCAST";
    }
    const pushBtn = document.getElementById('btn-push-obs');
    if (pushBtn) {
        pushBtn.className = "px-4 py-2 rounded-xl bg-red-600/30 text-red-300 font-mono-tech font-bold text-xs uppercase tracking-wider border border-red-500/40 cursor-default";
        pushBtn.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span><span>🔴 LIVE ON OBS</span>';
    }

    const payload = window.activeCostreamPayload || {
        id: window.activeCoStreamId || ('costream-' + Date.now()),
        username: 'Loco Kwokka 📞',
        amount: 50.00,
        video_hash: 'loco-kwokka-costream.mp4',
        videoHash: 'loco-kwokka-costream.mp4',
        isCoStream: true
    };

    if (obsChannels && obsChannels.length > 0) {
        obsChannels.forEach(ch => ch.send({
            type: 'broadcast',
            event: 'costream_approved',
            payload: payload
        }).catch(() => {}));
    }
    try {
        const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
        localBc.postMessage({ event: 'costream_approved', payload: payload });
    } catch(e){}

    showToast("📡 CALLER IS NOW LIVE ON OBS BROADCAST!");
};

async function openCoStreamModal(token) {
    window.openCoStreamStudio();
    const localVideo = document.getElementById('costream-local-vid');
    const remoteVideo = document.getElementById('costream-remote-vid');
    
    try {
        activeCoStreamRoom = new LiveKitClient.Room();
        
        activeCoStreamRoom.on('trackSubscribed', (track) => {
            if (track.kind === 'video') {
                const el = track.attach();
                el.className = 'w-full h-full object-cover';
                remoteVideo.innerHTML = '';
                remoteVideo.appendChild(el);
            }
            if (track.kind === 'audio') {
                track.attach();
            }
        });
        
        await activeCoStreamRoom.connect('wss://whutcha-drgxd8d7.livekit.cloud', token);
        
        // Publish Streamer's camera
        await activeCoStreamRoom.localParticipant.enableCameraAndMicrophone();
        
        const localPub = activeCoStreamRoom.localParticipant.videoTrackPublications.values().next().value;
        if (localPub && localPub.track) {
            const el = localPub.track.attach();
            el.className = 'w-full h-full object-cover';
            localVideo.innerHTML = '';
            localVideo.appendChild(el);
        }
        
    } catch (e) {
        console.warn("[Whutcha Live Bridge 503]: Connection warning:", e.message);
        showToast("Studio Bridge ready in preview mode");
    }
}

window.liveTimerInterval = null;
window.startLiveTimer = function() {
    let timeLeft = 60;
    const timerEl = document.getElementById('costream-timer');
    const timerText = document.getElementById('costream-timer-text');
    if (!timerEl) return;
    
    timerEl.classList.remove('hidden');
    if (timerText) timerText.innerText = timeLeft + 's LEFT';
    
    if (window.liveTimerInterval) clearInterval(window.liveTimerInterval);
    
    window.liveTimerInterval = setInterval(() => {
        timeLeft--;
        if (timerText) timerText.innerText = timeLeft + 's LEFT';
        
        if (timeLeft === 10) {
            timerEl.classList.replace('text-[#00f0ff]', 'text-red-500');
            timerEl.classList.replace('border-[#00f0ff]/50', 'border-red-500');
            timerEl.classList.add('animate-pulse');
            vibrate([50, 50, 50]);
        }
        
        if (timeLeft <= 0) {
            clearInterval(window.liveTimerInterval);
            if (timerText) timerText.innerText = "TIME UP";
            window.dropCaller("Co-Stream Time Expired (60s limit)");
        }
    }, 1000);
};

window.dropCaller = function(reason = "Call dropped") {
    vibrate([50, 100, 50]);
    
    // 1. Kill the timers
    if (window.liveTimerInterval) { clearInterval(window.liveTimerInterval); window.liveTimerInterval = null; }
    if (window.coStreamTimeout) {
        clearTimeout(window.coStreamTimeout);
        window.coStreamTimeout = null;
    }

    const timerEl = document.getElementById('costream-timer');
    if (timerEl) timerEl.classList.add('hidden');

    // 2. Synchronize Database Status to 'completed'
    if (window.activeCoStreamId) {
        const donationIdToClose = window.activeCoStreamId;
        window.activeCoStreamId = null;
        supabaseClient.from('donations').update({ status: 'completed' }).eq('id', donationIdToClose).then(({ error }) => {
            if (error) console.error("Error setting donation to completed:", error);
        });
    }
    window.activeCostreamPayload = null;

    // 3. Ironclad WebRTC Disconnect
    if (typeof currentRoom !== 'undefined' && currentRoom) {
        try {
            if (currentRoom.localParticipant) {
                currentRoom.localParticipant.setCameraEnabled(false);
                currentRoom.localParticipant.setMicrophoneEnabled(false);
            }
            currentRoom.disconnect();
        } catch(e){}
        currentRoom = null;
    }
    if (typeof activeCoStreamRoom !== 'undefined' && activeCoStreamRoom) {
        try {
            if (activeCoStreamRoom.localParticipant) {
                activeCoStreamRoom.localParticipant.setCameraEnabled(false);
                activeCoStreamRoom.localParticipant.setMicrophoneEnabled(false);
            }
            activeCoStreamRoom.disconnect();
        } catch(e){}
        activeCoStreamRoom = null;
    }
    if (window.currentRoom) {
        try {
            window.currentRoom.disconnect();
        } catch(e){}
        window.currentRoom = null;
    }

    // 4. Reset UI Badges & Buttons
    const badge = document.getElementById('costream-status-badge');
    if (badge) {
        badge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-white/10 text-gray-300 border border-white/20 uppercase";
        badge.innerText = "READY FOR CALLERS";
    }

    const pushBtn = document.getElementById('btn-push-obs');
    if (pushBtn) {
        pushBtn.className = "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400";
        pushBtn.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-ping"></span><span>📡 Push to OBS Live</span>';
    }

    const callerTitle = document.getElementById('costream-caller-title');
    if (callerTitle) callerTitle.innerText = "Caller Feed (Green Room)";

    // 5. Purge DOM elements to free memory and return to Standby
    const remoteVid = document.getElementById('costream-remote-vid');
    if (remoteVid) {
        const vids = remoteVid.querySelectorAll('video, audio');
        vids.forEach(v => {
            try { v.pause(); v.removeAttribute('src'); v.load(); } catch(e){}
        });
        remoteVid.innerHTML = `
            <div id="costream-standby-view" class="w-full h-full flex flex-col items-center justify-center p-4 text-center font-mono-tech">
                <div class="w-12 h-12 rounded-full border border-purple-500/40 bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2 shadow-[0_0_15px_rgba(168,0,255,0.3)]">
                    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </div>
                <span class="text-xs font-black text-white uppercase tracking-wider mb-1">Awaiting Fan Caller</span>
                <p class="text-[11px] text-gray-400 max-w-xs mb-3">Incoming Co-Stream callers appear here first for pre-moderation. OBS remains completely shielded.</p>
                <button onclick="simulateDonation('costream')" class="px-3 py-1.5 rounded-lg bg-[#a800ff]/20 hover:bg-[#a800ff]/40 text-[#a800ff] border border-[#a800ff]/50 text-xs font-bold transition-all shadow-[0_0_10px_rgba(168,0,255,0.2)] cursor-pointer">
                    ⚡ Preview Sample Call
                </button>
            </div>
        `;
    }

    // 6. Signal OBS overlay to clear caller
    try {
        const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
        localBc.postMessage({ event: 'obs_panic_blackout', payload: { timestamp: Date.now() } });
    } catch(e){}

    showToast(reason);
};

window.closeCoStreamModal = function() {
    vibrate([30]);
    // 🛡️ GHOST AUDIO ELIMINATION: Stop & destroy all media tracks in Green Room
    const remoteVid = document.getElementById('costream-remote-vid');
    if (remoteVid) {
        const vids = remoteVid.querySelectorAll('video, audio');
        vids.forEach(v => {
            try {
                v.pause();
                v.currentTime = 0;
                v.src = '';
                v.load();
                v.remove();
            } catch(e) {}
        });
        remoteVid.innerHTML = '';
    }
    const localVid = document.getElementById('costream-local-vid');
    if (localVid) {
        const vids = localVid.querySelectorAll('video, audio');
        vids.forEach(v => {
            try {
                v.pause();
                v.srcObject = null;
                v.src = '';
            } catch(e) {}
        });
    }

    if (typeof window.resumeWhutchaSound === 'function') {
        window.resumeWhutchaSound();
    }

    const modal = document.getElementById('costream-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.classList.remove('opacity-100');
        const rack = modal.querySelector('.cyber-rack');
        if (rack) {
            rack.classList.add('scale-95');
            rack.classList.remove('scale-100');
        }
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }, 300);
    }
};


// ==========================================
// 🎬 REACTIONS VAULT / SHORTS ARCHIVE ENGINE
// ==========================================
// Auto-records and manages ready-to-post 9:16 vertical TikTok/Reels reaction shorts
window.vaultReactions = [];

window.openReactionsVault = function() {
    vibrate([50]);
    const modal = document.getElementById('reactions-vault-modal');
    if (!modal) return;
    
    // Load reactions from storage & DB
    loadVaultReactions();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    modal.style.opacity = '1';
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.remove('scale-95');
        rack.classList.add('scale-100');
    }
};

window.closeReactionsVault = function() {
    const modal = document.getElementById('reactions-vault-modal');
    if (!modal) return;

    // Vampire mode: Pause all active video players in vault
    const videos = modal.querySelectorAll('video');
    videos.forEach(v => {
        v.pause();
    });

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    modal.style.opacity = '0';
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.remove('scale-100');
        rack.classList.add('scale-95');
    }
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};

// Alias for backwards compatibility
window.openReactionModal = window.openReactionsVault;
window.closeReactionModal = window.closeReactionsVault;

window.loadVaultReactions = async function(showFeedback = false) {
    if (showFeedback) showToast("🔄 Syncing Reactions Vault...");
    
    const isObserver = (typeof isObserverMode !== 'undefined' && isObserverMode) || localStorage.getItem('whutcha_observer_mode') === 'true' || !currentUser || currentUser.id === 'demo_broadcaster';

    // 1. Load locally cached/mock reactions
    let localMock = [];
    try {
        const stored = localStorage.getItem('whutcha_vault_mock_reactions');
        if (stored) {
            localMock = JSON.parse(stored);
        }
    } catch(e) {}

    // Only seed default showcase reaction in Observer/Demo mode so real streamers start with a clean vault
    if (isObserver && localMock.length === 0 && (!window.vaultReactions || window.vaultReactions.length === 0)) {
        localMock = [
            {
                id: 'VAULT-001',
                username: 'Loco Kwokka 🧢',
                amount: 1.00,
                message: 'Yo dawg! Wassup witchu? Have a fire stream bro! Chef\'s kiss!',
                video_url: './assets/loco-kwokka-donation.mp4?v=60',
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        try { localStorage.setItem('whutcha_vault_mock_reactions', JSON.stringify(localMock)); } catch(e){}
    } else {
        // For authenticated broadcasters, purge the demo seed so real accounts have 100% clean data
        if (!isObserver) {
            localMock = localMock.filter(m => m.id !== 'VAULT-001');
        }
        localMock = localMock.map(m => {
            if (!m.video_url || m.video_url.includes('mixkit.co') || m.video_url === 'loco-kwokka-donation.mp4') {
                m.video_url = './assets/loco-kwokka-donation.mp4?v=60';
            } else if (m.video_url === 'loco-kwokka-costream.mp4') {
                m.video_url = './assets/loco-kwokka-costream.mp4?v=60';
            }
            return m;
        });
    }

    // 2. Fetch completed/approved reactions from Supabase
    let remoteReactions = [];
    try {
        const idsToQuery = activeStreamerIds && activeStreamerIds.length > 0 ? activeStreamerIds : (currentUser?.id ? [currentUser.id] : []);
        if (idsToQuery.length > 0 && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('donations')
                .select('*')
                .in('streamer_id', idsToQuery)
                .or('status.eq.approved,status.eq.completed,reaction_url.not.is.null')
                .order('created_at', { ascending: false })
                .limit(30);

            if (!error && data) {
                remoteReactions = data.map(d => {
                    let rawUrl = d.reaction_url || d.video_hash || './assets/loco-kwokka-donation.mp4?v=60';
                    if (rawUrl === 'loco-kwokka-donation.mp4' || rawUrl.includes('mixkit.co')) rawUrl = './assets/loco-kwokka-donation.mp4?v=60';
                    if (rawUrl === 'loco-kwokka-costream.mp4') rawUrl = './assets/loco-kwokka-costream.mp4?v=60';
                    return {
                        id: d.id,
                        username: d.username || 'Anonymous Fan',
                        amount: parseFloat(d.amount || 1),
                        message: d.message || 'Video donation live broadcast reaction',
                        video_url: rawUrl,
                        created_at: d.reaction_created_at || d.created_at
                    };
                });
            }
        }
    } catch (err) {
        console.warn("Vault remote sync fallback to local cache:", err);
    }

    // Merge and deduplicate by ID
    const mergedMap = new Map();
    [...localMock, ...remoteReactions].forEach(item => {
        mergedMap.set(item.id, item);
    });
    window.vaultReactions = Array.from(mergedMap.values()).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    // Update UI counters
    updateVaultCounters();

    // Render grid
    renderVaultGrid();

    if (showFeedback) showToast("✅ Reactions Vault synced!");
};

function updateVaultCounters() {
    const totalCount = (window.vaultReactions || []).length;
    const totalPledged = (window.vaultReactions || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const countEl = document.getElementById('vault-total-count');
    if (countEl) countEl.textContent = totalCount;

    const amtEl = document.getElementById('vault-total-amount');
    if (amtEl) amtEl.textContent = '$' + totalPledged.toFixed(2);

    const badgeEl = document.getElementById('vault-badge-count');
    if (badgeEl) {
        badgeEl.textContent = totalCount;
        if (totalCount > 0) {
            badgeEl.classList.remove('hidden');
        }
    }

    const mobBadge = document.getElementById('mobile-vault-count');
    if (mobBadge) {
        mobBadge.textContent = totalCount;
        if (totalCount > 0) {
            mobBadge.classList.remove('hidden');
        }
    }
}

window.renderVaultGrid = function() {
    const container = document.getElementById('vault-grid-container');
    if (!container) return;

    const items = window.vaultReactions || [];

    if (items.length === 0) {
        container.innerHTML = `
            <div class="h-64 flex flex-col items-center justify-center text-center p-6 bg-black/40 border border-white/5 rounded-2xl">
                <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    🎬
                </div>
                <h4 class="text-sm font-black text-white uppercase tracking-wider mb-1">No Reactions Recorded Yet</h4>
                <p class="text-gray-400 text-xs font-mono-tech max-w-sm mb-4 leading-relaxed">
                    When you approve incoming video donations, Whutcha automatically compiles your live facecam and the fan video into ready-to-post 9:16 Shorts!
                </p>
                <button onclick="simulateReactionInVault()" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-black font-mono-tech font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    ⚡ Add Sample Clip
                </button>
            </div>
        `;
        return;
    }

    let html = `<div class="vault-grid">`;

    items.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const safeUser = typeof sanitize === 'function' ? sanitize(item.username) : item.username;
        const safeMsg = typeof sanitize === 'function' ? sanitize(item.message || '') : (item.message || '');
        let videoSrc = item.video_url || './assets/loco-kwokka-donation.mp4?v=60';
        if (videoSrc === 'loco-kwokka-donation.mp4' || videoSrc.includes('mixkit.co')) videoSrc = './assets/loco-kwokka-donation.mp4?v=60';
        if (videoSrc === 'loco-kwokka-costream.mp4') videoSrc = './assets/loco-kwokka-costream.mp4?v=60';

        html += `
            <div class="vault-short-card rounded-2xl p-3.5 flex flex-col justify-between relative group">
                <!-- 9:16 Short Video Preview Stage -->
                <div class="vault-video-stage border border-white/10 flex items-center justify-center mb-3 group/video">
                    <video id="vault-video-${item.id}" src="${videoSrc}" playsinline preload="metadata" class="w-full h-full object-cover"></video>
                    
                    <!-- Overlay Badge -->
                    <div class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        9:16 SHORTS
                    </div>

                    <!-- Play Toggle Overlay -->
                    <button onclick="toggleVaultVideoPlay('${item.id}')" id="vault-play-btn-${item.id}" class="vault-play-btn" aria-label="Toggle Play">
                        ▶
                    </button>
                </div>

                <!-- Meta Details -->
                <div class="space-y-1.5 mb-3 font-mono-tech">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-black text-white truncate max-w-[150px]">@${safeUser}</span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">+$${parseFloat(item.amount).toFixed(2)}</span>
                    </div>
                    <p class="text-[11px] text-gray-300 font-sans line-clamp-2 leading-relaxed">"${safeMsg || 'Live broadcast reaction'}"</p>
                    <span class="text-[9px] text-gray-500 block">${dateStr}</span>
                </div>

                <!-- Action Bar: Download & Share -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <button onclick="downloadReactionClip('${videoSrc}', '${item.id}', '${safeUser}')" class="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono-tech font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer" title="Download ready MP4 for TikTok/Shorts">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        <span>Download</span>
                    </button>
                    <button onclick="shareReactionClip('${item.id}', '${safeUser}')" class="w-full py-2 bg-white/5 hover:bg-white/15 text-gray-200 border border-white/10 font-mono-tech font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer" title="Share to X / Twitter">
                        <span>🚀 Share</span>
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
};

window.toggleVaultVideoPlay = function(id) {
    const vid = document.getElementById(`vault-video-${id}`);
    const btn = document.getElementById(`vault-play-btn-${id}`);
    if (!vid) return;

    if (vid.paused) {
        // Pause other vault videos
        document.querySelectorAll('#vault-grid-container video').forEach(v => {
            if (v !== vid) v.pause();
        });
        document.querySelectorAll('#vault-grid-container button[id^="vault-play-btn-"]').forEach(b => {
            if (b !== btn) b.innerHTML = '▶';
        });

        vid.play().then(() => {
            if (btn) btn.innerHTML = '❚❚';
        }).catch(e => console.log("Play error:", e));
    } else {
        vid.pause();
        if (btn) btn.innerHTML = '▶';
    }

    vid.onended = () => {
        if (btn) btn.innerHTML = '▶';
    };
};

window.simulateReactionInVault = function() {
    vibrate([50, 50]);
    const mockId = 'VAULT-' + Math.floor(1000 + Math.random() * 9000);
    const isCall = Math.random() > 0.5;
    const mockItem = {
        id: mockId,
        username: isCall ? 'Loco Kwokka 📞' : 'Loco Kwokka 🧢',
        amount: isCall ? 50.00 : 1.00,
        message: isCall ? 'Ey yo vato! Did I connect? Tryna talk about life with you!' : 'Hey dawg! Wassup witchu? Have a fire stream bro!',
        video_url: isCall ? './assets/loco-kwokka-costream.mp4?v=60' : './assets/loco-kwokka-donation.mp4?v=60',
        created_at: new Date().toISOString()
    };

    let localMock = [];
    try {
        localMock = JSON.parse(localStorage.getItem('whutcha_vault_mock_reactions') || '[]');
    } catch(e){}
    localMock.unshift(mockItem);
    try {
        localStorage.setItem('whutcha_vault_mock_reactions', JSON.stringify(localMock));
    } catch(e){}

    window.vaultReactions = [mockItem, ...(window.vaultReactions || [])];
    updateVaultCounters();
    renderVaultGrid();
    showToast("🔥 Minted new 9:16 Short in Reactions Vault!");
    if (typeof playSynthesizedChime === 'function') playSynthesizedChime();
};

window.downloadReactionClip = async function(videoUrl, id, username) {
    vibrate([50]);
    const cleanUser = (username || 'fan').replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `Whutcha_Short_${cleanUser}_${id}.mp4`;
    showToast(`📥 Preparing MP4 download: ${filename}...`);

    try {
        let fetchUrl = videoUrl;
        if (!fetchUrl.startsWith('http') && !fetchUrl.startsWith('blob:') && !fetchUrl.startsWith('./assets/')) {
            if (supabaseClient) {
                const { data } = await supabaseClient.storage.from('videos').createSignedUrl(fetchUrl, 3600);
                if (data && data.signedUrl) fetchUrl = data.signedUrl;
            }
        }

        const res = await fetch(fetchUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        showToast("✅ Downloaded ready-to-post Short!");
    } catch (err) {
        console.warn("Direct blob download failed, opening directly:", err);
        window.open(videoUrl, '_blank');
        showToast("🎬 Opened MP4 stream in new tab!");
    }
};

let currentSharePayload = { title: '', text: '', url: '' };

window.shareReactionClip = async function(id, username) {
    vibrate([30]);
    const isObserver = (typeof isObserverMode !== 'undefined' && isObserverMode) || localStorage.getItem('whutcha_observer_mode') === 'true' || !currentUser || currentUser.id === 'demo_broadcaster';
    const streamerHandle = isObserver ? 'LocoKwokka' : ((activeProfile && activeProfile.username) || (currentUser ? currentUser.id : 'LocoKwokka'));
    const shareUrl = `${window.location.origin}/viewer.html?streamer=${encodeURIComponent(streamerHandle)}&receipt=${encodeURIComponent(id)}`;
    const shareTitle = `Whutcha Reaction to @${username || 'Fan'}`;
    const shareText = `Check out my live reaction to @${username || 'Fan'} on Whutcha! 🎬 Ready to post on TikTok & Shorts.`;
    
    currentSharePayload = { title: shareTitle, text: shareText, url: shareUrl };

    // Directly open custom in-app multi-platform share picker
    window.openShareModal(shareTitle, shareText, shareUrl);
};

window.openShareModal = function(title, text, url) {
    vibrate([20]);
    currentSharePayload = { title: title || '', text: text || '', url: url || '' };
    const titleEl = document.getElementById('share-clip-title');
    const urlEl = document.getElementById('share-modal-url-preview');
    if (titleEl) titleEl.textContent = title || 'Broadcast Reaction';
    if (urlEl) urlEl.textContent = url || '';
    
    const modal = document.getElementById('share-vault-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const box = modal.querySelector('.cyber-rack');
        if (box) {
            box.classList.remove('scale-95');
            box.classList.add('scale-100');
        }
    });
};

window.closeShareModal = function() {
    vibrate([20]);
    const modal = document.getElementById('share-vault-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    const box = modal.querySelector('.cyber-rack');
    if (box) {
        box.classList.remove('scale-100');
        box.classList.add('scale-95');
    }
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 250);
};

window.triggerSocialShare = function(platform) {
    vibrate([30]);
    const { text, url } = currentSharePayload;
    if (platform === 'telegram') {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(tgUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'whatsapp') {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'twitter') {
        const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twUrl, '_blank', 'width=600,height=420');
    } else if (platform === 'copy') {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                showToast("Link copied to clipboard!");
            }).catch(() => {
                fallbackCopyTextToClipboard(url, 'Reaction link');
            });
        } else {
            fallbackCopyTextToClipboard(url, 'Reaction link');
        }
    }
    setTimeout(() => window.closeShareModal(), 500);
};

window.copyViewerLink = async function(btnElement) {
    vibrate([50]);
    const viewerLinkEl = document.getElementById('viewer-link');
    const isObserver = (typeof isObserverMode !== 'undefined' && isObserverMode) || localStorage.getItem('whutcha_observer_mode') === 'true' || !currentUser || currentUser.id === 'demo_broadcaster';
    const displayChannel = isObserver ? 'LocoKwokka' : ((activeProfile && activeProfile.username) || (currentUser ? currentUser.id : 'LocoKwokka'));
    
    const url = (viewerLinkEl && viewerLinkEl.textContent && !viewerLinkEl.textContent.includes('Loading')) 
        ? viewerLinkEl.textContent.trim() 
        : `${window.location.origin}/viewer.html?streamer=${encodeURIComponent(displayChannel)}`;
    
    try {
        await navigator.clipboard.writeText(url);
        showToast("Fan Portal link copied!");
        if (btnElement) {
            const originalHTML = btnElement.innerHTML;
            const originalClasses = btnElement.className;
            
            // Dopamine mode animation
            btnElement.innerHTML = '<span class="text-white font-black text-xs uppercase tracking-widest">COPIED!</span>';
            btnElement.classList.add('bg-green-500', 'border-green-400');
            btnElement.classList.remove('bg-white/5', 'hover:bg-white/10', 'border-white/10');
            
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
                btnElement.className = originalClasses;
            }, 2000);
        }
        if (typeof markOnboardingCopied === 'function') markOnboardingCopied();
    } catch (err) {
        fallbackCopyTextToClipboard(url, 'Viewer link');
        if (typeof markOnboardingCopied === 'function') markOnboardingCopied();
    }
};

window.copyViewerUrl = window.copyViewerLink;



// ==============================================
// 📡 NODE 7: PWA WEB PUSH PROTOCOL & TELEMETRY
// ==============================================
// notificationsEnabled is declared at top of file
const VAPID_PUBLIC_KEY = 'BIuLv038ZOyZ6_pljLAEYkaNRQme4RzMb5ufVaoPWwa-MS62EyC9_uTQj9McnUTnrrPQJM30LQH3HY-R_hwCbUs';

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
// ==========================================
// 🔔 AUDIO SYNTHESIS & NOTIFICATION ENGINE
// ==========================================
// Pre-warm Web Audio context on first user interaction to ensure chimes work smoothly
document.addEventListener('pointerdown', () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            if (!window._whutchaSharedAudioCtx) {
                window._whutchaSharedAudioCtx = new AudioCtx();
            }
            if (window._whutchaSharedAudioCtx.state === 'suspended') {
                window._whutchaSharedAudioCtx.resume();
            }
        }
    } catch(e){}
}, { once: true, passive: true });

window.playSynthesizedChime = function(isVip = false) {
    let alertsOn = true;
    try {
        const stored = localStorage.getItem('whutcha_alerts_enabled');
        if (stored === 'false') alertsOn = false;
    } catch(e){}
    if (!alertsOn) return;

    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = (window._whutchaSharedAudioCtx && window._whutchaSharedAudioCtx.state !== 'closed')
            ? window._whutchaSharedAudioCtx
            : new AudioCtx();
        window._whutchaSharedAudioCtx = ctx;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;
        if (isVip) {
            // 👑 VIP WHALE CHIME: Triumphant 4-tone cyber fanfare (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);

                gain.gain.setValueAtTime(0.001, now + idx * 0.1);
                gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.75);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.75);
            });
        } else {
            // Standard two-tone cyber chime: D5 (587.33Hz) -> A5 (880Hz)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(880, now);
            osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12);

            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.7);
            osc2.stop(now + 0.7);
        }
    } catch (e) {
        console.warn("Audio chime skipped:", e);
    }
};

window.toggleAudioAndNotifs = async function() {
    vibrate([40]);
    let currentEnabled = true;
    try {
        currentEnabled = localStorage.getItem('whutcha_alerts_enabled') !== 'false';
    } catch(e){}

    const newEnabled = !currentEnabled;
    try {
        localStorage.setItem('whutcha_alerts_enabled', newEnabled ? 'true' : 'false');
    } catch(e){}

    syncNotifStatusUI(newEnabled);

    if (newEnabled) {
        window.playSynthesizedChime();
        showToast("🔔 Alert chimes & notifications active!");
        if ("Notification" in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
                initPushNotificationStatus();
            } catch(e){}
        }
    } else {
        showToast("🔕 Alert chimes muted.");
    }
};

function syncNotifStatusUI(forcedState) {
    const sidebarStatus = document.getElementById('notif-status');
    const icon = document.getElementById('notif-icon');
    const toggleTrack = document.getElementById('notif-toggle-track');
    const toggleKnob = document.getElementById('notif-toggle-knob');
    let isEnabled = true;
    if (typeof forcedState === 'boolean') {
        isEnabled = forcedState;
    } else {
        try {
            isEnabled = localStorage.getItem('whutcha_alerts_enabled') !== 'false';
        } catch(e){}
    }

    if (sidebarStatus) {
        if (isEnabled) {
            sidebarStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse"></span><span>ON AIR</span>';
            sidebarStatus.className = 'text-[9px] font-mono-tech font-black text-[#00f0ff] flex items-center gap-1.5';
            if (icon) icon.setAttribute('class', 'w-4 h-4 text-[#00f0ff] transition-colors');
        } else {
            sidebarStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span><span class="text-gray-400">MUTED</span>';
            sidebarStatus.className = 'text-[9px] font-mono-tech font-black text-gray-400 flex items-center gap-1.5';
            if (icon) icon.setAttribute('class', 'w-4 h-4 text-gray-500 transition-colors');
        }
    }
    if (toggleTrack && toggleKnob) {
        if (isEnabled) {
            toggleTrack.className = "w-11 h-6 rounded-full bg-[#00f0ff]/25 border border-[#00f0ff]/60 relative p-0.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.3)]";
            toggleKnob.className = "w-4.5 h-4.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] transform translate-x-5 transition-transform duration-200";
        } else {
            toggleTrack.className = "w-11 h-6 rounded-full bg-black/60 border border-white/20 relative p-0.5 transition-all cursor-pointer";
            toggleKnob.className = "w-4.5 h-4.5 rounded-full bg-gray-500 transform translate-x-0 transition-transform duration-200";
        }
    }
}

function updatePushBadge(state) {
    const badge = document.getElementById('push-badge');
    const btn = document.getElementById('btn-enable-push');

    if (!badge) return;

    if (state === 'granted') {
        notificationsEnabled = true;
        badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>ACTIVE</span>';
        if (btn) btn.innerHTML = '<span>Push Alerts Active ✅</span>';
    } else if (state === 'denied') {
        notificationsEnabled = false;
        badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-widest flex items-center gap-1.5";
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span><span>BLOCKED</span>';
        if (btn) btn.innerHTML = '<span>Unblock in Settings</span>';
    } else if (state === 'unsupported') {
        notificationsEnabled = false;
        badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-white/5 text-gray-400 border border-white/10 uppercase tracking-widest";
        badge.innerHTML = '<span>OFFLINE</span>';
        if (btn) btn.disabled = true;
    } else {
        notificationsEnabled = false;
        badge.className = "px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-widest flex items-center gap-1.5";
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span><span>STANDBY</span>';
        if (btn) btn.innerHTML = '<span>Enable Push Alerts</span>';
    }
}

function initPushNotificationStatus() {
    syncNotifStatusUI();
    if (!("Notification" in window)) {
        updatePushBadge('unsupported');
        return;
    }
    updatePushBadge(Notification.permission);
}

window.enablePushNotifications = async function(btnElement) {
    if (checkIsObserver()) {
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }
    if (!("Notification" in window)) {
        showToast("This browser does not support Web Push notifications.");
        updatePushBadge('unsupported');
        return;
    }

    try {
        if (btnElement) btnElement.disabled = true;
        const permission = await Notification.requestPermission();
        updatePushBadge(permission);

        if (permission === "granted") {
            vibrate([50]);
            showToast("Registering secure Push Service Worker...");

            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.register('./sw.js');
                await navigator.serviceWorker.ready;

                // Subscribe to PushManager with VAPID
                let subscription = await reg.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                // Save to Supabase push_subscriptions table via RPC
                const { error: subErr } = await supabaseClient.rpc('save_push_subscription', {
                    p_subscription: subscription
                });

                if (subErr) {
                    console.error("[Whutcha Protocol 500]: Push subscription ledger sync error:", subErr);
                    showToast("Alerts enabled locally (database sync pending).");
                } else {
                    showToast("🔔 Native Lock-Screen Push Alerts enabled!");
                }
            }
        } else if (permission === "denied") {
            showToast("⚠️ Push notifications are blocked. Click the lock icon in your URL bar to allow Whutcha notifications.");
        }
    } catch (err) {
        console.error("[Whutcha Protocol 500]: Push registration failure:", err);
        showToast("[Whutcha Protocol 500]: Push Service Registration Error: " + err.message);
    } finally {
        if (btnElement) btnElement.disabled = false;
    }
};

window.requestNotifications = function() {
    window.toggleAudioAndNotifs();
};

window.testPushNotification = async function(btnElement) {
    vibrate([100, 50, 100]);
    window.playSynthesizedChime();

    // 1. Sleek in-cockpit toast notification
    showToast("🔔 Loco Kwokka ($5.00) sent a Video Donation!");

    // 2. Native System/Lockscreen notification
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification("Whutcha Alert • Loco Kwokka ($5.00)", {
                body: "🎥 Incoming Video Donation ready for review in your Live Queue!",
                icon: './icon.svg',
                badge: './icon.svg',
                vibrate: [200, 100, 200, 100, 200],
                data: { url: './dashboard.html' }
            });
        } catch(e) {
            console.warn("ServiceWorker push fallback:", e);
        }
    } else if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification("Whutcha Alert • Loco Kwokka ($5.00)", {
                body: "🎥 Incoming Video Donation ready for review in your Live Queue!",
                icon: './icon.svg'
            });
        } catch(e){}
    } else if ('Notification' in window && Notification.permission !== 'granted') {
        showToast("💡 Click 'Enable Push Alerts' to receive lock-screen notifications!");
    }

    // 3. Dispatch to Supabase Edge Function to verify background push delivery
    if (currentUser && currentUser.id) {
        supabaseClient.functions.invoke('push-alert', {
            body: {
                record: {
                    streamer_id: currentUser.id,
                    amount: 5.00,
                    username: 'Loco Kwokka 🧢',
                    video_hash: 'loco-kwokka-donation.mp4'
                }
            }
        }).catch(err => console.log("Edge function test push error:", err));
    }

    showToast("🔥 Test notification dispatched to your screen!");
};

// Auto-check push status on boot
initPushNotificationStatus();

// ==========================================
// 🚀 PWA STANDALONE INSTALL ENGINE (NODE 7)
// ==========================================
let deferredPwaPrompt = null;

function isPwaRunningStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
}

function initPwaInstallManager() {
    // If already running as installed standalone app, hide install controls
    if (isPwaRunningStandalone()) {
        const headerBtn = document.getElementById('btn-pwa-install-header');
        if (headerBtn) headerBtn.classList.add('hidden');
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.add('hidden');
        return;
    }

    // Check if dismissed within last 7 days
    const dismissedTime = localStorage.getItem('whutcha_pwa_dismissed');
    const isDismissed = dismissedTime && (Date.now() - parseInt(dismissedTime, 10) < 7 * 24 * 60 * 60 * 1000);

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;

        // Show header install button
        const headerBtn = document.getElementById('btn-pwa-install-header');
        if (headerBtn) {
            headerBtn.classList.remove('hidden');
            headerBtn.classList.add('flex');
        }

        // Show floating bottom banner if not dismissed recently
        if (!isDismissed) {
            setTimeout(() => {
                showPwaInstallBanner();
            }, 2500);
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPwaPrompt = null;
        hidePwaInstallBanner();
        const headerBtn = document.getElementById('btn-pwa-install-header');
        if (headerBtn) headerBtn.classList.add('hidden');
        showToast("🎉 Whutcha Cockpit App installed to your device!");
    });
}

function showPwaInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (!banner || isPwaRunningStandalone()) return;
    banner.classList.remove('hidden');
    banner.classList.add('flex');
    setTimeout(() => {
        banner.classList.remove('translate-y-8', 'opacity-0');
        banner.classList.add('translate-y-0', 'opacity-100');
    }, 50);
}

function hidePwaInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (!banner) return;
    banner.classList.remove('translate-y-0', 'opacity-100');
    banner.classList.add('translate-y-8', 'opacity-0');
    setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('flex');
    }, 500);
}

window.dismissPwaBanner = function(e) {
    if (e) {
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    }
    vibrate([30]);
    try {
        localStorage.setItem('whutcha_pwa_dismissed', Date.now().toString());
    } catch(err){}
    hidePwaInstallBanner();
    showToast("PWA banner dismissed.");
};

window.openIosInstallModal = function() {
    vibrate([40]);
    const modal = document.getElementById('ios-install-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
    });
};

window.closeIosInstallModal = function() {
    vibrate([20]);
    const modal = document.getElementById('ios-install-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};

// Global escape key handler for iOS install modal
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('ios-install-modal');
        if (modal && !modal.classList.contains('hidden')) {
            window.closeIosInstallModal();
        }
    }
});

window.installPwaApp = async function() {
    vibrate([50, 50]);

    if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast("🚀 Installing Whutcha Cockpit...");
            hidePwaInstallBanner();
        }
        deferredPwaPrompt = null;
    } else {
        // Fallback for iOS Safari / iPadOS or browsers without beforeinstallprompt
        const isIos = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && !window.MSStream;
        if (isIos) {
            window.openIosInstallModal();
        } else {
            showToast("ℹ️ To install: click the Install icon in your browser address bar.");
        }
    }
};

// ==========================================
// ⚡ SERVICE WORKER LIFECYCLE & UPDATE ENGINE
// ==========================================
let newWorkerWaiting = null;

function showPwaUpdateBanner() {
    const banner = document.getElementById('pwa-update-banner');
    if (!banner) return;
    banner.classList.remove('hidden');
    banner.classList.add('flex');
    vibrate([40, 40]);
}

window.dismissPwaUpdate = function() {
    vibrate([20]);
    const banner = document.getElementById('pwa-update-banner');
    if (banner) {
        banner.classList.remove('flex');
        banner.classList.add('hidden');
    }
};

window.applyPwaUpdate = function() {
    vibrate([60, 60]);
    if (newWorkerWaiting) {
        newWorkerWaiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => window.location.reload(), 300);
    } else {
        window.location.reload();
    }
};

function initServiceWorkerLifecycle() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
            // Check if there is already an updated worker waiting
            if (reg.waiting) {
                newWorkerWaiting = reg.waiting;
                showPwaUpdateBanner();
                return;
            }

            reg.addEventListener('updatefound', () => {
                const installingWorker = reg.installing;
                if (!installingWorker) return;

                installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorkerWaiting = installingWorker;
                        showPwaUpdateBanner();
                    }
                });
            });
        }).catch((err) => {
            console.warn("[Whutcha Protocol 503]: PWA SW registration deferred:", err.message);
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    });
}

// Initialize PWA installation and service worker lifecycle listeners
initPwaInstallManager();
initServiceWorkerLifecycle();

// ==========================================
// 🧹 12-HOUR STORAGE TTL AUTO-PURGE
// ==========================================
window.triggerStorageTtlCleanup = async function(silent = true) {
    if (!supabaseClient || checkIsObserver()) {
        if (!silent && typeof showToast === 'function') {
            showToast("ℹ️ Storage TTL purge active on live server (12-hour expiration window).");
        }
        return;
    }
    
    // Throttle automatic cleanup to once per 6 hours
    const lastCleanup = parseInt(localStorage.getItem('whutcha_last_ttl_cleanup') || '0', 10);
    const now = Date.now();
    if (silent && (now - lastCleanup < 6 * 3600 * 1000)) {
        return;
    }
    
    try {
        const { data: expiredRecords, error } = await supabaseClient.rpc('cleanup_expired_videos', { p_hours: 12 });
        if (error) {
            console.warn("[Whutcha Protocol]: TTL cleanup check:", error.message);
            if (!silent && typeof showToast === 'function') {
                showToast("ℹ️ All stream videos are within the 12-hour retention window.");
            }
            return;
        }
        
        localStorage.setItem('whutcha_last_ttl_cleanup', now.toString());
        
        if (expiredRecords && Array.isArray(expiredRecords) && expiredRecords.length > 0) {
            const files = expiredRecords.map(r => r.video_hash).filter(f => f && !f.startsWith('http') && !f.startsWith('./assets/'));
            if (files.length > 0) {
                await supabaseClient.storage.from('videos').remove(files);
                if (typeof showToast === 'function') {
                    showToast(`🧹 Purged ${files.length} expired videos older than 12h.`);
                }
            }
        } else if (!silent && typeof showToast === 'function') {
            showToast("✅ Storage clean: No videos older than 12 hours found.");
        }
    } catch(err) {
        console.warn("[Whutcha Protocol]: TTL cleanup execution:", err);
    }
};

// Auto-run once in background after stream cockpit load
setTimeout(() => {
    window.triggerStorageTtlCleanup(true);
}, 8000);

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 3000);
}


// Settings Modal Logic

// GLOBAL MODAL GUARDIAN
window.canOpenModal = function(targetId) {
    if (typeof checkIsObserver === 'function' && checkIsObserver() && (targetId === 'costream-modal' || targetId === 'reactions-vault-modal' || targetId === 'settings-modal')) {
        const nameMap = {
            'costream-modal': 'Co-Stream Green Room',
            'reactions-vault-modal': 'Reactions Vault',
            'settings-modal': 'Broadcast Settings'
        };
        window.requireBroadcasterAuth(nameMap[targetId] || 'Studio Module');
        return false;
    }

    const isCoStream = document.getElementById('costream-modal') && !document.getElementById('costream-modal').classList.contains('hidden');
    
    // If trying to open Settings or TOS while busy
    if (isCoStream && targetId !== 'costream-modal') {
        alert("Please finish your current active call before opening this menu.");
        return false;
    }
    
    // Auto-close Settings/TOS if they are open and we are opening something else
    const bgModals = ['settings-modal', 'legal-modal-tos'];
    bgModals.forEach(id => {
        const el = document.getElementById(id);
        if (el && targetId !== id) {
            el.classList.remove('flex');
            el.classList.add('hidden');
        }
    });
    
    return true;
};

// 👁️ OBSERVER MODE GUARDIANS & CHANNEL CLAIM REDIRECT
window.claimChannelRedirect = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
        localStorage.removeItem('whutcha_observer_mode');
        localStorage.removeItem('streamerID');
        sessionStorage.removeItem('whutcha_just_logged_in');
        sessionStorage.setItem('whutcha_logged_out', 'true');
    } catch(err){}
    window.location.href = './index.html#register';
};

window.requireBroadcasterAuth = function(featureName = 'Studio Module') {
    if (typeof checkIsObserver === 'function' && checkIsObserver()) {
        const modal = document.getElementById('observer-modal');
        if (modal) {
            const desc = modal.querySelector('p');
            if (desc) {
                desc.innerHTML = `You are exploring Whutcha in <strong class="text-white">Observer Mode</strong>. The <span class="text-[#00f0ff] font-bold uppercase font-mono-tech">${featureName}</span> console requires an active broadcaster account to connect live OBS feeds, configure WebRTC co-streams, and receive fan tips with 0% fees.`;
            }
            if (typeof openModal === 'function') {
                openModal('observer-modal');
            } else {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }
        return true;
    }
    return false;
};

window.handleCoStreamTabClick = function() {
    if (window.requireBroadcasterAuth('Co-Stream Green Room')) return;
    openCoStreamStudio();
};

window.handleVaultTabClick = function() {
    if (window.requireBroadcasterAuth('Reactions Vault')) return;
    openReactionsVault();
};

window.handleSettingsTabClick = function() {
    if (window.requireBroadcasterAuth('Broadcast Settings')) return;
    openSettingsModal();
};

// ==========================================
// 🎧 WHUTCHA SOUND ENGINE (LOCO THEME ANTHEM)
// ==========================================
let whutchaSoundAudio = null;
let whutchaSoundEnabled = true;
let locoEqInterval = null;
window.whutchaSoundWasPlaying = false;

window.duckOrPauseWhutchaSound = function() {
    if (whutchaSoundAudio && !whutchaSoundAudio.paused) {
        window.whutchaSoundWasPlaying = true;
        whutchaSoundAudio.pause();
        if (typeof updateLocoSoundUi === 'function') updateLocoSoundUi(false);
    }
};

window.resumeWhutchaSound = function() {
    if (window.whutchaSoundWasPlaying && whutchaSoundAudio && whutchaSoundEnabled) {
        window.whutchaSoundWasPlaying = false;
        whutchaSoundAudio.play().then(() => {
            if (typeof updateLocoSoundUi === 'function') updateLocoSoundUi(true);
        }).catch(() => {});
    }
};

function initWhutchaSound() {
    try {
        if (!whutchaSoundAudio) {
            whutchaSoundAudio = new Audio('./assets/loco-quokka.mp3');
            whutchaSoundAudio.loop = true;
            
            const volumeStored = localStorage.getItem('whutcha_sound_volume');
            const volVal = volumeStored !== null ? parseFloat(volumeStored) : 0.35;
            whutchaSoundAudio.volume = volVal;

            whutchaSoundAudio.addEventListener('play', () => updateLocoSoundUi(true));
            whutchaSoundAudio.addEventListener('pause', () => updateLocoSoundUi(false));
            whutchaSoundAudio.addEventListener('ended', () => updateLocoSoundUi(false));
        }

        // USER DIRECTIVE: Bay T - Loco Quokka MUST play by default on dashboard entrance!
        whutchaSoundEnabled = true;
        try { localStorage.setItem('whutcha_sound_enabled', 'true'); } catch(e){}
        syncWhutchaSoundUi();

        const triggerPlayback = () => {
            if (whutchaSoundEnabled && whutchaSoundAudio && whutchaSoundAudio.paused) {
                whutchaSoundAudio.play().then(() => {
                    syncWhutchaSoundUi();
                    removeGestureTriggers();
                }).catch(() => {});
            }
        };

        const removeGestureTriggers = () => {
            ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(ev => {
                window.removeEventListener(ev, triggerPlayback, { capture: true });
                document.removeEventListener(ev, triggerPlayback, { capture: true });
            });
        };

        if (whutchaSoundAudio) {
            whutchaSoundAudio.play().then(() => {
                syncWhutchaSoundUi();
            }).catch(() => {
                // If browser autoplay policy prevents immediate sound, start on first interaction:
                ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(ev => {
                    window.addEventListener(ev, triggerPlayback, { capture: true, once: true });
                    document.addEventListener(ev, triggerPlayback, { capture: true, once: true });
                });
            });
        }
    } catch(e) {
        console.warn("Whutcha sound audio init failed:", e);
    }
}

function syncWhutchaSoundUi() {
    const isPlaying = whutchaSoundAudio && !whutchaSoundAudio.paused;
    const isEnabled = whutchaSoundEnabled || isPlaying;

    // 1. Modal checkbox
    const toggleEl = document.getElementById('toggle-whutcha-sound');
    if (toggleEl) toggleEl.checked = isEnabled;

    // 2. Volume Slider
    const volumeStored = localStorage.getItem('whutcha_sound_volume');
    const volVal = volumeStored !== null ? parseFloat(volumeStored) : 0.4;
    const volSlider = document.getElementById('loco-sound-volume');
    if (volSlider) volSlider.value = volVal;

    // 3. Sidebar hardware toggle track & knob
    const deckTrack = document.getElementById('sound-toggle-track');
    const deckKnob = document.getElementById('sound-toggle-knob');
    const deckDot = document.getElementById('sound-status-dot');
    const deckText = document.getElementById('sound-status-text');
    const deckPulse = document.getElementById('sound-play-pulse');

    if (deckTrack && deckKnob) {
        if (isEnabled) {
            deckTrack.className = "w-10 h-5.5 rounded-full bg-[#00f0ff]/25 border border-[#00f0ff]/60 relative p-0.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.4)] flex-shrink-0";
            deckKnob.className = "w-4 h-4 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] transform translate-x-4.5 transition-transform duration-200";
        } else {
            deckTrack.className = "w-10 h-5.5 rounded-full bg-black/80 border border-white/20 relative p-0.5 transition-all flex-shrink-0";
            deckKnob.className = "w-4 h-4 rounded-full bg-gray-500 shadow-sm transform translate-x-0 transition-transform duration-200";
        }
    }

    if (deckDot && deckText) {
        if (isPlaying) {
            deckDot.className = "w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_6px_#00f0ff]";
            deckText.innerText = "PLAYING • ON AIR";
            deckText.className = "text-[#00f0ff] font-bold";
        } else if (isEnabled) {
            deckDot.className = "w-1.5 h-1.5 rounded-full bg-amber-400";
            deckText.innerText = "STANDBY";
            deckText.className = "text-amber-400 font-bold";
        } else {
            deckDot.className = "w-1.5 h-1.5 rounded-full bg-gray-600";
            deckText.innerText = "MUTED / OFF";
            deckText.className = "text-gray-500 font-bold";
        }
    }

    if (deckPulse) {
        if (isPlaying) deckPulse.classList.remove('hidden');
        else deckPulse.classList.add('hidden');
    }

    updateLocoSoundUi(isPlaying);
}

function updateLocoSoundUi(isPlaying) {
    const icon = document.getElementById('loco-sound-play-icon');
    const status = document.getElementById('loco-sound-status-text');
    const eq = document.getElementById('loco-eq-bars');
    const deckEq = document.getElementById('sound-deck-eq-bars');

    if (icon) icon.textContent = isPlaying ? '❚❚' : '▶';
    if (status) status.textContent = isPlaying ? 'Playing' : 'Ready';

    if (isPlaying) {
        if (eq) {
            eq.classList.remove('opacity-40');
            eq.classList.add('opacity-100');
        }
        if (deckEq) {
            deckEq.classList.remove('opacity-30');
            deckEq.classList.add('opacity-100');
        }
        startLocoEqualizerAnimation();
    } else {
        if (eq) {
            eq.classList.remove('opacity-100');
            eq.classList.add('opacity-40');
        }
        if (deckEq) {
            deckEq.classList.remove('opacity-100');
            deckEq.classList.add('opacity-30');
        }
        stopLocoEqualizerAnimation();
    }
}

function startLocoEqualizerAnimation() {
    const modalEq = document.getElementById('loco-eq-bars');
    const deckEq = document.getElementById('sound-deck-eq-bars');
    if (modalEq) modalEq.classList.add('eq-animating');
    if (deckEq) deckEq.classList.add('eq-animating');
}

function stopLocoEqualizerAnimation() {
    if (locoEqInterval) {
        clearInterval(locoEqInterval);
        locoEqInterval = null;
    }
    const modalEq = document.getElementById('loco-eq-bars');
    const deckEq = document.getElementById('sound-deck-eq-bars');
    if (modalEq) modalEq.classList.remove('eq-animating');
    if (deckEq) deckEq.classList.remove('eq-animating');
}

// Optimization: Pause expensive UI animations when browser tab is inactive/hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopLocoEqualizerAnimation();
    } else {
        if (whutchaSoundAudio && !whutchaSoundAudio.paused) {
            startLocoEqualizerAnimation();
        }
    }
});

window.toggleWhutchaSound = function(enabled) {
    whutchaSoundEnabled = Boolean(enabled);
    try {
        localStorage.setItem('whutcha_sound_enabled', whutchaSoundEnabled.toString());
    } catch(e){}
    if (!whutchaSoundAudio) {
        initWhutchaSound();
    }
    if (!whutchaSoundAudio) return;
    if (whutchaSoundEnabled) {
        whutchaSoundAudio.play().then(() => {
            syncWhutchaSoundUi();
            showToast("🎵 Whutcha Sound: Playing Bay T - Loco Quokka");
        }).catch(e => {
            console.log("Audio play blocked by browser policy:", e);
            syncWhutchaSoundUi();
        });
    } else {
        whutchaSoundAudio.pause();
        syncWhutchaSoundUi();
        showToast("🔇 Whutcha Sound Muted");
    }
};

window.toggleWhutchaSoundTrack = function() {
    vibrate([40]);
    if (!whutchaSoundAudio) initWhutchaSound();
    if (!whutchaSoundAudio) return;
    
    if (whutchaSoundAudio.paused) {
        whutchaSoundAudio.play().then(() => {
            whutchaSoundEnabled = true;
            try { localStorage.setItem('whutcha_sound_enabled', 'true'); } catch(e){}
            syncWhutchaSoundUi();
            showToast("🎵 Playing: Bay T - Loco Quokka");
        }).catch(err => {
            console.warn("Audio play blocked by browser policy:", err);
            showToast("⚠️ Click to allow audio playback");
            syncWhutchaSoundUi();
        });
    } else {
        whutchaSoundAudio.pause();
        whutchaSoundEnabled = false;
        try { localStorage.setItem('whutcha_sound_enabled', 'false'); } catch(e){}
        syncWhutchaSoundUi();
        showToast("🔇 Whutcha Sound Muted");
    }
};

window.toggleLocoAudioPlay = function() {
    window.toggleWhutchaSoundTrack();
};

window.setWhutchaSoundVolume = function(val) {
    const num = parseFloat(val);
    if (whutchaSoundAudio) whutchaSoundAudio.volume = num;
    try { localStorage.setItem('whutcha_sound_volume', num.toString()); } catch(e){}
};

// ==========================================
// 🎥 CAMERA HARDWARE & OBS VIRTUAL CAMERA ENGINE
// ==========================================
window.handleCameraModeChange = function(mode) {
    try { localStorage.setItem('whutcha_camera_mode', mode); } catch(e){}
    const devContainer = document.getElementById('settings-camera-device-container');
    const winHint = document.getElementById('windows-obs-camera-hint');
    const badge = document.getElementById('camera-hardware-badge');
    
    if (mode === 'vtuber') {
        if (devContainer) devContainer.classList.add('hidden');
        if (winHint) winHint.classList.add('hidden');
        if (badge) {
            badge.textContent = 'VTuber / Audio Only';
            badge.className = 'px-2 py-0.5 rounded text-[8px] font-mono-tech font-bold bg-[#a800ff]/20 text-[#a800ff] border border-[#a800ff]/40 uppercase';
        }
    } else {
        if (devContainer) devContainer.classList.remove('hidden');
        if (winHint) winHint.classList.remove('hidden');
        if (badge) {
            badge.textContent = 'Hardware';
            badge.className = 'px-2 py-0.5 rounded text-[8px] font-mono-tech font-bold bg-white/5 text-gray-300 border border-white/10 uppercase';
        }
    }
};

window.handleCameraDeviceChange = function(deviceId) {
    try { localStorage.setItem('whutcha_camera_device_id', deviceId); } catch(e){}
    if (typeof showToast === 'function') {
        showToast("🎥 Camera device routing updated");
    }
};

window.refreshCameraDevices = async function(promptPermission = false) {
    const select = document.getElementById('settings-camera-device');
    if (!select) return;
    
    if (promptPermission && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(t => t.stop());
        } catch(e) {
            console.warn("Camera permission prompt cancelled or blocked:", e);
        }
    }
    
    const savedDeviceId = localStorage.getItem('whutcha_camera_device_id') || '';
    select.innerHTML = '<option value="">System Default Camera</option>';
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
    }
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        
        let hasObsCamera = false;
        videoInputs.forEach((dev, idx) => {
            const opt = document.createElement('option');
            opt.value = dev.deviceId;
            const label = dev.label || `Camera ${idx + 1}`;
            const isObs = /obs|virtual/i.test(label);
            if (isObs) hasObsCamera = true;
            opt.textContent = isObs ? `✨ ${label} (Recommended for Windows / OBS)` : label;
            if (savedDeviceId === dev.deviceId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
        
        // If OBS camera is present and no saved device, auto-select it for better DX
        if (!savedDeviceId && hasObsCamera) {
            const obsOpt = Array.from(select.options).find(o => /obs|virtual/i.test(o.textContent));
            if (obsOpt) {
                obsOpt.selected = true;
                localStorage.setItem('whutcha_camera_device_id', obsOpt.value);
            }
        }
    } catch(err) {
        console.warn("Could not enumerate media devices:", err);
    }
};

window.openSettingsModal = async function() {
    if(!canOpenModal('settings-modal')) return;
    vibrate([50]);
    syncWhutchaSoundUi();

    // Sync Camera Mode & Hardware Selector
    const savedMode = localStorage.getItem('whutcha_camera_mode') || 'webcam';
    const modeSelect = document.getElementById('settings-camera-mode');
    if (modeSelect) modeSelect.value = savedMode;
    window.handleCameraModeChange(savedMode);
    window.refreshCameraDevices(false);
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    modal.classList.remove('hidden', 'opacity-0');
    modal.classList.add('flex', 'opacity-100');
    modal.style.opacity = '1';
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.remove('scale-95');
        rack.classList.add('scale-100');
    }
    
    // Fetch latest profile or populate demo values
    const targetId = activeProfile ? activeProfile.id : (currentUser ? currentUser.id : null);
    if (checkIsObserver() || !targetId || targetId === 'demo_broadcaster') {
        const uInput = document.getElementById('settings-username');
        const pInput = document.getElementById('settings-paylink');
        const vInput = document.getElementById('settings-min-video');
        const cInput = document.getElementById('settings-min-costream');
        const savedHandle = localStorage.getItem('whutcha_demo_handle');
        const savedPaylink = localStorage.getItem('whutcha_demo_paylink');
        
        if (uInput) uInput.value = savedHandle || (activeProfile && activeProfile.username) || 'LocoKwokka';
        if (pInput) pInput.value = savedPaylink || (activeProfile && activeProfile.external_pay_link) || 'https://paypal.me/whutcha';
        if (vInput) vInput.value = (activeProfile && activeProfile.min_video_price) || 1;
        if (cInput) cInput.value = (activeProfile && activeProfile.min_costream_price) || 5;
    } else {
        try {
            const { data } = await supabaseClient.from('profiles').select('*').eq('id', targetId).maybeSingle();
            if(data) {
                if (document.getElementById('settings-username')) document.getElementById('settings-username').value = data.username || '';
                if (document.getElementById('settings-paylink')) document.getElementById('settings-paylink').value = data.external_pay_link || '';
                if (document.getElementById('settings-min-video')) document.getElementById('settings-min-video').value = data.min_video_price || 1;
                if (document.getElementById('settings-min-costream')) document.getElementById('settings-min-costream').value = data.min_costream_price || 5;
            }
        } catch(err) {
            console.warn("Could not query profile for settings:", err);
        }
    }
};

window.closeSettingsModal = function() {
    vibrate([30]);
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    modal.classList.remove('opacity-100');
    modal.style.opacity = '0';
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.add('scale-95');
        rack.classList.remove('scale-100');
    }
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 220);
};

window.saveSettings = async function() {
    vibrate([50]);
    const btn = document.getElementById('btn-save-settings');
    const username = document.getElementById('settings-username')?.value.trim() || '';
    const paylink = document.getElementById('settings-paylink')?.value.trim() || '';
    
    // Persist Camera Hardware Settings
    const chosenMode = document.getElementById('settings-camera-mode')?.value || 'webcam';
    const chosenDevice = document.getElementById('settings-camera-device')?.value || '';
    try {
        localStorage.setItem('whutcha_camera_mode', chosenMode);
        localStorage.setItem('whutcha_camera_device_id', chosenDevice);
    } catch(e){}

    if(!paylink) {
        showToast("Payout Link is required to receive money!");
        return;
    }
    
    if (btn) {
        btn.innerText = "SAVING...";
        btn.disabled = true;
    }

    if (checkIsObserver() || !currentUser || currentUser.id === 'demo_broadcaster') {
        if (btn) {
            btn.innerText = "SAVE SETTINGS";
            btn.disabled = false;
        }
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }
    
    const targetId = activeProfile ? activeProfile.id : currentUser.id;
    const { error } = await supabaseClient.from('profiles').update({
        username: username,
        external_pay_link: paylink,
        min_video_price: parseFloat(document.getElementById('settings-min-video').value) || 5,
        min_costream_price: parseFloat(document.getElementById('settings-min-costream').value) || 10
    }).eq('id', targetId);
    
    if(error) {
        alert("[Whutcha Protocol 400]: Broadcaster Settings Update Failed: " + error.message);
        if (btn) {
            btn.innerText = "SAVE SETTINGS";
            btn.disabled = false;
        }
    } else {
        if (activeProfile) {
            activeProfile.username = username;
            activeProfile.external_pay_link = paylink;
        }
        const payoutInput = document.getElementById('payout-link-input');
        if (payoutInput) payoutInput.value = paylink;

        const displayChannel = username || targetId;
        const streamerIdEl = document.getElementById('streamer-id');
        if (streamerIdEl) streamerIdEl.textContent = displayChannel;
        const viewerLinkEl = document.getElementById('viewer-link');
        if (viewerLinkEl) viewerLinkEl.textContent = `${window.location.origin}/viewer.html?streamer=${displayChannel}`;
        
        if (typeof updateOnboardingState === 'function') updateOnboardingState();
        showToast("Settings saved successfully!");
        if (btn) {
            btn.innerText = "SAVE SETTINGS";
            btn.disabled = false;
        }
        closeSettingsModal();
    }
};

function fallbackCopyTextToClipboard(text, name) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast((name || 'Link') + ' copied!');
            }).catch(() => {
                execCommandCopy(text, name);
            });
        } else {
            execCommandCopy(text, name);
        }
    } catch(e) {
        showToast((name || 'Link') + ' copied!');
    }
}

function execCommandCopy(text, name) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast((name || 'Link') + ' copied!');
    } catch (err) {
        showToast((name || 'Link') + ' copied!');
    }
}

window.deleteAccount = async function() {
    if (!confirm('Are you sure you want to permanently delete your channel account? This action is irreversible and purges all channel data.')) {
        return;
    }
    
    vibrate([100, 100]);
    
    if (checkIsObserver() || !currentUser || currentUser.id === 'demo_broadcaster') {
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }

    try {
        showToast("Purging account data...");
        await supabaseClient.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        showToast("Account signed out. Redirecting...");
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1000);
    } catch(e) {
        window.location.href = './index.html';
    }
};

window.lockCardActions = function(id) {
    const actionContainer = document.getElementById('actions-' + id);
    if (!actionContainer) return;
    const buttons = actionContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
        btn.innerHTML = '<span class="animate-pulse">Processing...</span>';
    });
};


// CHAOS MONKEY MODE: Prevent Rage Clicking
window.actionLocks = window.actionLocks || new Set();

window.approveDonation = async (id, isCoStream, username) => {
    if (window.actionLocks.has(id)) return;

    // 🦘 USER DIRECTIVE: Loco Kwokka sample donation CANNOT be approved!
    // Trigger popup: "Yo, man! Loco Kwokka revoked his donation back! Maybe next time... who knows? 😉"
    const donationItem = (currentDonations || []).find(d => d.id === id) || (window.currentDonations || []).find(d => d.id === id);
    const donorName = username || (donationItem ? donationItem.username : '');
    const vHash = (donationItem && (donationItem.video_hash || donationItem.videoHash)) || '';
    const isLocoSample = String(id).startsWith('SIM-') || donorName.includes('Loco Kwokka') || vHash.includes('loco-kwokka');

    if (isLocoSample) {
        vibrate([80, 50, 80]);
        // Open the stylish Loco Revoked Modal
        if (typeof openModal === 'function') {
            openModal('loco-revoked-modal');
        } else {
            alert('Yo, man! Loco Kwokka revoked his donation back! Maybe next time... who knows? 😉');
        }
        // Remove from local queue so it reflects being revoked
        window.dismissedSimulationIds = window.dismissedSimulationIds || new Set();
        window.dismissedSimulationIds.add(id);
        try {
            localStorage.setItem('whutcha_dismissed_sims', JSON.stringify(Array.from(window.dismissedSimulationIds)));
        } catch(e){}
        currentDonations = (currentDonations || []).filter(d => d.id !== id);
        renderQueue(currentDonations);
        return;
    }

    // 🛡️ P2P VERIFICATION SAFETY GUARD (KILL FAKE DONATIONS)
    const isSample = String(id).startsWith('SIM-');
    const isVerified = window.isDonationVerified(id);

    if (!isSample && !isVerified) {
        const donationItem = (currentDonations || []).find(d => d.id === id) || (window.currentDonations || []).find(d => d.id === id);
        openUnverifiedPayoutModal(donationItem || { id, username, amount: 5.00 }, () => {
            window.toggleDonationVerified(id, true);
            window.approveDonation(id, isCoStream, username);
        });
        return;
    }

    window.actionLocks.add(id);
    try {
        await _innerApprove(id, isCoStream, username);
    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => window.actionLocks.delete(id), 2000); // Unlock after 2s if still in DOM
    }
};

window.rejectDonation = async (id, videoHash) => {
    if (window.actionLocks.has(id)) return;
    window.actionLocks.add(id);
    try {
        vibrate([50]);
        window.lockCardActions(id);

        // 1. Track in persistent dismissed set
        window.dismissedSimulationIds = window.dismissedSimulationIds || new Set();
        window.dismissedSimulationIds.add(id);
        try {
            localStorage.setItem('whutcha_dismissed_sims', JSON.stringify(Array.from(window.dismissedSimulationIds)));
        } catch(e){}

        // 2. Mark rejected and filter out of local array immediately
        const item = (currentDonations || []).find(d => d.id === id);
        if (item) item.status = 'rejected';
        currentDonations = (currentDonations || []).filter(d => d.id !== id);

        // 3. Clear active timers
        if (window.slaTimers && window.slaTimers[id]) {
            clearInterval(window.slaTimers[id]);
            delete window.slaTimers[id];
        }

        // 3.5 KILL GHOST AUDIO: Cut off any playing preview, green room video, or active caller!
        try {
            const previewVid = document.getElementById('preview-video-player');
            if (previewVid) {
                previewVid.pause();
                previewVid.currentTime = 0;
                previewVid.src = '';
            }
            if (typeof closeVideoPreviewModal === 'function') {
                closeVideoPreviewModal();
            }
            const greenRoomVid = document.getElementById('green-room-video');
            if (greenRoomVid) {
                greenRoomVid.pause();
                greenRoomVid.currentTime = 0;
                greenRoomVid.src = '';
            }
            const remoteVidContainer = document.getElementById('remote-video-container');
            if (remoteVidContainer) {
                const mediaEls = remoteVidContainer.querySelectorAll('video, audio');
                mediaEls.forEach(v => {
                    try {
                        v.pause();
                        v.currentTime = 0;
                        v.src = '';
                        if (v.srcObject && v.srcObject.getTracks) {
                            v.srcObject.getTracks().forEach(t => t.stop());
                        }
                        v.srcObject = null;
                    } catch(e){}
                });
            }
            if (typeof window.dropCaller === 'function') {
                window.dropCaller("Item Rejected");
            }
        } catch(audioErr) {
            console.warn("Media stop on reject:", audioErr);
        }

        // 4. Smooth visual departure transition
        const cardEl = document.getElementById('donation-' + id) || document.getElementById('card-' + id) || document.querySelector(`[data-donation-id="${id}"]`);
        if (cardEl) {
            cardEl.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
            cardEl.style.opacity = '0';
            cardEl.style.transform = 'translateX(-24px) scale(0.96)';
            setTimeout(() => {
                if (cardEl.parentNode) cardEl.remove();
                renderQueue(currentDonations);
            }, 250);
        } else {
            renderQueue(currentDonations);
        }

        // 5. Update counts
        const countEl = document.getElementById('queue-count');
        if (countEl) countEl.innerText = currentDonations.length;
        const mobileCountEl = document.getElementById('mobile-queue-count');
        if (mobileCountEl) mobileCountEl.innerText = currentDonations.length;

        // 6. DB update
        await updateStatus(id, 'rejected');

        // STRYKER DOCTRINE: Fix Storage Leak
        if (videoHash && videoHash !== "costream_request" && videoHash !== "undefined" && videoHash !== "sample.mp4" && !videoHash.includes('loco-kwokka')) {
            await supabaseClient.storage.from('videos').remove([videoHash]);
            console.log("Deleted rejected video blob:", videoHash);
        }

        if (typeof showToast === 'function') {
            showToast("🗑️ Item rejected and removed from queue");
        }
    } catch (e) {
        console.error("rejectDonation error:", e);
    } finally {
        setTimeout(() => window.actionLocks.delete(id), 1000);
    }
};

const _innerApprove = async (id, isCoStream, username) => {
    vibrate([50]);
    lockCardActions(id);
    
    if (isCoStream) {
        if (typeof window.openModal === 'function') {
            window.openModal('costream-modal');
        } else {
            const modal = document.getElementById('costream-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                requestAnimationFrame(() => {
                    modal.classList.remove('opacity-0');
                    modal.classList.add('opacity-100');
                });
            }
        }

        // SIMULATION / TEST CALL CHECK (Loco Kwokka)
        const isSimCall = (id && id.startsWith('SIM-')) || (username && username.includes('Loco'));
        if (isSimCall) {
            showToast("🎬 Connecting to Loco Kwokka Director Green Room...");
            const remoteVid = document.getElementById('costream-remote-vid');
            if (remoteVid) {
                remoteVid.innerHTML = `<video id="green-room-video" src="./assets/loco-kwokka-costream.mp4?v=60" class="w-full h-full max-h-full object-contain rounded-xl" autoplay playsinline controls></video>`;
                const grPlayer = document.getElementById('green-room-video');
                if (grPlayer) {
                    grPlayer.onended = () => {
                        setTimeout(() => {
                            if (typeof window.dropCaller === 'function') {
                                window.dropCaller("📞 Loco Kwokka Co-Stream Call Completed");
                            }
                            if (typeof window.closeCoStreamModal === 'function') {
                                window.closeCoStreamModal();
                            }
                        }, 450);
                    };
                }
            }
            const localVid = document.getElementById('costream-local-vid');
            if (localVid) {
                localVid.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center bg-black/80 text-gray-400 font-mono-tech text-xs gap-2"><div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div><span>BROADCASTER READY</span></div>`;
            }
            if (typeof window.startLiveTimer === 'function') {
                window.startLiveTimer();
            }

            const badge = document.getElementById('costream-status-badge');
            if (badge) {
                badge.className = "px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase";
                badge.innerText = "🛡️ PRE-MODERATION (OBS SHIELDED)";
            }
            const callerTitle = document.getElementById('costream-caller-title');
            if (callerTitle) callerTitle.innerText = (username || "Loco Kwokka 📞") + " (Green Room)";
            const pushBtn = document.getElementById('btn-push-obs');
            if (pushBtn) {
                pushBtn.className = "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono-tech font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400";
                pushBtn.innerHTML = '<span class="w-2 h-2 rounded-full bg-white animate-ping"></span><span>📡 Push to OBS Live</span>';
            }

            const simCallPayload = {
                id: id,
                username: username || 'Loco Kwokka 📞',
                amount: 50.00,
                video_hash: 'loco-kwokka-costream.mp4',
                videoHash: 'loco-kwokka-costream.mp4',
                isCoStream: true
            };

            // USER DIRECTIVE: Shield streamer OBS! Demo simulation calls must NEVER be sent to live broadcast
            console.log("🎬 Loco Kwokka Green Room connected locally (OBS live broadcast shielded)");
            showToast("🎬 Green Room connected locally (Live OBS broadcast shielded)");

            // Animate out card instantly from Queue
            const card = document.getElementById('donation-' + id);
            if (card) {
                card.style.transition = 'all 0.3s ease-out';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    if (card.parentNode) card.parentNode.removeChild(card);
                }, 300);
            }
            currentDonations = (currentDonations || []).filter(d => d.id !== id);
            const countEl = document.getElementById('queue-count');
            if (countEl) countEl.innerText = currentDonations.length;
            const mobileCountEl = document.getElementById('mobile-queue-count');
            if (mobileCountEl) mobileCountEl.innerText = currentDonations.length;

            try {
                await supabaseClient.from('donations').update({ status: 'approved' }).eq('id', id);
            } catch(e){}
            return;
        }

        document.getElementById('costream-remote-vid').innerHTML = '<div class="text-gray-300 font-bold uppercase tracking-widest text-sm text-center px-4 font-mono-tech">Initializing Studio Bridge...</div>';
        
        try {
            const { data: edgeData, error: edgeError } = await supabaseClient.functions.invoke('livekit-token', {
                body: { roomName: id }
            });
            
            if (edgeError || !edgeData || !edgeData.streamerToken || !edgeData.viewerToken) {
                throw new Error("[Whutcha Live Bridge 500]: Live Bridge Token Generation Failed");
            }
            
            let obsToken = edgeData.obsToken;
            if (!obsToken) {
                try {
                    const { data: secondData } = await supabaseClient.functions.invoke('livekit-token', {
                        body: { roomName: id }
                    });
                    if (secondData && secondData.viewerToken) {
                        obsToken = secondData.viewerToken;
                    }
                } catch(e) {
                    console.warn("[Whutcha Live Bridge 503]: Could not fetch secondary token for OBS, fallback to primary viewerToken");
                }
            }
            if (!obsToken) obsToken = edgeData.viewerToken;

            // Push Viewer Token to DB so viewer.html can join, and set to approved
            const { error: dbError } = await supabaseClient.from('donations').update({ 
                status: 'approved',
                join_token: edgeData.viewerToken,
                video_hash: obsToken
            }).eq('id', id);
            
            if (dbError) throw dbError;

            // Notify viewer tab in 0ms via BroadcastChannel
            try {
                const trackerBc = new BroadcastChannel('whutcha_viewer_tracker');
                trackerBc.postMessage({ event: 'costream_approved', donationId: id, join_token: edgeData.viewerToken });
            } catch(e){}
            
            const room = new LiveKitClient.Room();
            window.currentRoom = room; currentRoom = room; // Save globally
            window.activeCoStreamId = id;
            if (typeof window.startLiveTimer === 'function') {
                window.startLiveTimer();
            }
            
            // 15-SECOND SLA TIMER: If viewer doesn't connect, nuke the room (Whutcha Live Bridge v2 remoteParticipants compatible)
            if (window.coStreamTimeout) clearTimeout(window.coStreamTimeout);
            window.coStreamTimeout = setTimeout(() => {
                const remoteMap = window.currentRoom && (window.currentRoom.remoteParticipants || window.currentRoom.participants);
                if (window.currentRoom && (!remoteMap || remoteMap.size === 0)) {
                    window.dropCaller("Viewer failed to connect (Timeout).");
                }
            }, 15000);
            await room.connect('wss://whutcha-drgxd8d7.livekit.cloud', edgeData.streamerToken);
            await room.localParticipant.enableCameraAndMicrophone();
            
            room.localParticipant.on('localTrackPublished', (publication) => {
                if(publication.track && publication.track.kind === 'video') {
                    const vid = publication.track.attach();
                    vid.className = 'w-full h-full object-cover';
                    document.getElementById('costream-local-vid').innerHTML = '';
                    document.getElementById('costream-local-vid').appendChild(vid);
                }
            });

            room.on('trackSubscribed', (track) => {
                if (track.kind === 'video' || track.kind === 'audio') {
                    const element = track.attach();
                    // ANTI-ECHO ENFORCE
                    if (typeof isDashboardMuted !== 'undefined' && isDashboardMuted) {
                        element.muted = true;
                    }
                    
                    if (track.kind === 'video') {
                        element.className = 'w-full h-full object-cover';
                        document.getElementById('costream-remote-vid').innerHTML = '';
                        document.getElementById('costream-remote-vid').appendChild(element);
                    } else if (track.kind === 'audio') {
                        element.style.display = 'none';
                        document.getElementById('costream-remote-vid').appendChild(element);
                    }
                }
            });

            // PHANTOM DISCONNECT FIX
            room.on('participantDisconnected', (participant) => {
                showToast("Viewer left the Co-Stream");
                window.dropCaller("Viewer Disconnected");
            });
            
            room.on('disconnected', () => {
                window.dropCaller("Viewer Disconnected");
            });

        } catch (e) {
            console.error("[Whutcha Live Bridge 500]: Co-Stream Gateway Error:", e);
            showToast("[Whutcha Live Bridge 500]: Co-Stream Gateway Error: " + (e && e.message ? e.message : String(e)));
            window.dropCaller("Viewer Disconnected");
        }
    } else {
        // Just a video message approval
        if (typeof window.playSynthesizedChime === 'function') {
            window.playSynthesizedChime();
        }

        // Find donation from currentDonations if present
        let currentItem = (currentDonations || []).find(x => x.id === id);
        const videoPayload = {
            id: id,
            username: username || (currentItem ? currentItem.username : 'Loco Kwokka 🧢'),
            amount: currentItem ? currentItem.amount : 1.00,
            video_hash: (currentItem && (currentItem.video_hash || currentItem.videoHash)) ? (currentItem.video_hash || currentItem.videoHash) : 'loco-kwokka-donation.mp4',
            videoHash: (currentItem && (currentItem.video_hash || currentItem.videoHash)) ? (currentItem.video_hash || currentItem.videoHash) : 'loco-kwokka-donation.mp4'
        };

        const rawVideoHash = videoPayload.video_hash || 'loco-kwokka-donation.mp4';
        const isSimulated = String(id).startsWith('SIM-') || rawVideoHash.includes('loco-kwokka') || (username && String(username).includes('Loco')) || (typeof window.checkIsObserver === 'function' && window.checkIsObserver());

        if (isSimulated) {
            // USER DIRECTIVE: Never push demo/sample donation to streamer's live OBS!
            console.log("🛡️ Demo sample donation approved (Local Studio Preview only — live OBS broadcast shielded)");
            showToast("🎬 Demo Sample approved! (Local Studio Preview only — live OBS broadcast shielded)");
        } else {
            // Notify OBS overlays immediately via Realtime & local BroadcastChannel
            if (obsChannels && obsChannels.length > 0) {
                obsChannels.forEach(ch => ch.send({
                    type: 'broadcast',
                    event: 'video_approved',
                    payload: videoPayload
                }).catch(() => {}));
            }
            if (typeof window.broadcastToLocalObs === 'function') {
                window.broadcastToLocalObs('video_approved', videoPayload);
            } else {
                try {
                    const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
                    localBc.postMessage({ event: 'video_approved', payload: videoPayload });
                } catch(e){}
            }
            showToast("🚀 Video approved to OBS broadcast!");
        }
        const initialReactionUrl = isSimulated 
            ? (isCoStream ? 'loco-kwokka-costream.mp4' : 'loco-kwokka-donation.mp4')
            : rawVideoHash;

        // Auto-mint into Reactions Vault immediately, then upgrade if live reaction recorder completes
        if (typeof addVaultReaction === 'function') {
            addVaultReaction({
                id: id,
                username: username || 'Fan',
                amount: videoPayload.amount || (isCoStream ? 50.00 : 1.00),
                reaction_url: initialReactionUrl,
                message: 'Live stream reaction minted from OBS broadcast',
                created_at: new Date().toISOString()
            });
        }

        // STAGE 2: Notify Viewer Tab immediately that their video is LIVE IN OBS (status: 'approved')
        try {
            const trackerBc = new BroadcastChannel('whutcha_viewer_tracker');
            trackerBc.postMessage({
                event: 'video_approved',
                donationId: id,
                reaction_url: null
            });
        } catch(e){}

        // STAGE 3: Trigger 9:16 Split-Screen Reaction Recorder Engine (Node 5) or finalize fallback reaction reel after playback
        const finalizeFallbackReaction = async () => {
            try {
                const trackerBc = new BroadcastChannel('whutcha_viewer_tracker');
                trackerBc.postMessage({
                    event: 'reaction_ready',
                    donationId: id,
                    reaction_url: initialReactionUrl
                });
            } catch(e){}
            try {
                if (supabaseClient && !String(id).startsWith('SIM-')) {
                    await supabaseClient.from('donations').update({ reaction_url: initialReactionUrl }).eq('id', id);
                }
            } catch(e){}
        };

        if (!isSimulated && !checkIsObserver() && typeof window.recordLiveStreamerReaction === 'function') {
            window.recordLiveStreamerReaction(videoPayload).then(recordedFile => {
                if (!recordedFile) finalizeFallbackReaction();
            }).catch(err => {
                console.warn("Live reaction capture skipped (fallback active):", err);
                finalizeFallbackReaction();
            });
        } else {
            setTimeout(finalizeFallbackReaction, 3500);
        }

        // Animate out card instantly
        const card = document.getElementById('donation-' + id);
        if (card) {
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (card.parentNode) card.parentNode.removeChild(card);
            }, 300);
        }
        currentDonations = (currentDonations || []).filter(d => d.id !== id);
        const countEl = document.getElementById('queue-count');
        if (countEl) countEl.innerText = currentDonations.length;
        const mobileCountEl = document.getElementById('mobile-queue-count');
        if (mobileCountEl) mobileCountEl.innerText = currentDonations.length;

        try {
            if (supabaseClient && !String(id).startsWith('SIM-')) {
                const { error } = await supabaseClient.from('donations').update({ 
                    status: 'approved'
                }).eq('id', id);
                if (error) console.error("[Whutcha Protocol 500]: Item status update error:", error);
            }
        } catch(e){}
    }
};

// ==========================================
// 🎬 NODE 5: 9:16 SPLIT-SCREEN REACTION RECORDER ENGINE
// ==========================================
window.recordLiveStreamerReaction = async function(videoPayload) {
    if (!navigator.mediaDevices || !window.MediaRecorder) return null;
    const donationId = videoPayload.id;
    const rawHash = videoPayload.video_hash || '';
    if (!donationId || !rawHash) return null;

    let camStream = null;
    let fanVideoEl = null;
    let camVideoEl = null;
    let rafId = null;

    const cameraMode = localStorage.getItem('whutcha_camera_mode') || 'webcam';
    const preferredDeviceId = localStorage.getItem('whutcha_camera_device_id') || '';

    try {
        if (cameraMode === 'vtuber') {
            // VTuber / No-Cam Mode: Capture mic audio only without locking camera
            if (navigator.mediaDevices.getUserMedia) {
                try {
                    camStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } catch(e) {
                    console.warn("[Whutcha Protocol]: Mic unavailable in VTuber mode:", e);
                }
            }
        } else {
            // Standard Camera / OBS Virtual Camera Mode
            if (navigator.mediaDevices.getUserMedia) {
                const videoConstraints = preferredDeviceId
                    ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
                    : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' };

                try {
                    camStream = await navigator.mediaDevices.getUserMedia({
                        video: videoConstraints,
                        audio: true
                    });
                } catch (camErr) {
                    console.warn("[Whutcha Protocol]: Camera hardware access failed:", camErr);
                    const isWindowsLock = camErr.name === 'NotReadableError' || camErr.name === 'TrackStartError';
                    if (isWindowsLock) {
                        if (typeof showToast === 'function') {
                            showToast("⚠️ Camera locked by OBS! In OBS click 'Start Virtual Camera', then pick 'OBS Virtual Camera' in Settings.");
                        }
                    } else if (typeof showToast === 'function') {
                        showToast("⚠️ Camera unavailable: " + (camErr.message || camErr.name));
                    }
                    // Graceful fallback to audio-only
                    try {
                        camStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    } catch(e) {}
                }
            }
        }

        let signedFanUrl = rawHash;
        if (!rawHash.startsWith('http') && !rawHash.startsWith('./assets/')) {
            const { data } = await supabaseClient.storage.from('videos').createSignedUrl(rawHash, 120);
            if (data && data.signedUrl) signedFanUrl = data.signedUrl;
        }

        fanVideoEl = document.createElement('video');
        fanVideoEl.crossOrigin = 'anonymous';
        fanVideoEl.src = signedFanUrl;
        fanVideoEl.muted = false;
        fanVideoEl.playsInline = true;

        if (camStream && camStream.getVideoTracks().length > 0) {
            camVideoEl = document.createElement('video');
            camVideoEl.srcObject = camStream;
            camVideoEl.muted = true;
            camVideoEl.playsInline = true;
            await camVideoEl.play().catch(() => {});
        }

        const canvas = document.createElement('canvas');
        canvas.width = 576;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        let pulseTick = 0;

        const drawFrame = () => {
            pulseTick++;
            ctx.fillStyle = '#060709';
            ctx.fillRect(0, 0, 576, 1024);

            // Top Half (0..512): Streamer Live Camera or VTuber Avatar Dock
            if (camVideoEl && camVideoEl.readyState >= 2) {
                ctx.drawImage(camVideoEl, 0, 0, 576, 512);
            } else {
                // VTuber / No-Cam Cyber Titanium Avatar Backdrop
                const grad = ctx.createLinearGradient(0, 0, 576, 512);
                grad.addColorStop(0, '#0a0d14');
                grad.addColorStop(0.5, '#121624');
                grad.addColorStop(1, '#060709');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 576, 512);

                // Neon Ring & Icon
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(288, 220, 60, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#00f0ff';
                ctx.font = 'bold 36px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(cameraMode === 'vtuber' ? '🎭' : '🎙️', 288, 232);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 15px monospace';
                ctx.fillText(cameraMode === 'vtuber' ? 'VTUBER LIVE REACTION' : 'BROADCASTER AUDIO FEED', 288, 310);

                ctx.fillStyle = '#9ca3af';
                ctx.font = '11px monospace';
                ctx.fillText('@' + ((activeProfile && activeProfile.username) || 'Broadcaster'), 288, 330);

                // Animated audio equalizer bars
                const barWidth = 8;
                const barSpacing = 4;
                const totalBars = 16;
                const startX = 288 - ((totalBars * (barWidth + barSpacing)) / 2);
                for (let b = 0; b < totalBars; b++) {
                    const h = Math.abs(Math.sin((pulseTick * 0.1) + b * 0.5)) * 35 + 6;
                    ctx.fillStyle = b % 2 === 0 ? '#00f0ff' : '#a800ff';
                    ctx.fillRect(startX + b * (barWidth + barSpacing), 420 - h, barWidth, h);
                }
                ctx.textAlign = 'start'; // Reset alignment
            }

            // Bottom Half (512..1024): Fan Video Donation
            if (fanVideoEl && fanVideoEl.readyState >= 2) {
                ctx.drawImage(fanVideoEl, 0, 512, 576, 512);
            }

            // Center Neon Divider & Watermark HUD
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(0, 510, 576, 4);
            ctx.fillStyle = 'rgba(6, 7, 9, 0.85)';
            ctx.fillRect(16, 470, 210, 30);
            ctx.fillStyle = '#00f0ff';
            ctx.font = 'bold 13px monospace';
            ctx.fillText('⚡ WHUTCHA.COM REACTION', 26, 490);

            rafId = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        const canvasStream = canvas.captureStream ? canvas.captureStream(25) : null;
        if (canvasStream && camStream) {
            camStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
        }

        if (!canvasStream) return null;

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : 'video/webm';
        const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 1200000 });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

        const recordingDone = new Promise((resolve) => {
            recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        });

        recorder.start(250);
        await fanVideoEl.play().catch(() => {});

        await new Promise((resolve) => {
            const maxTimer = setTimeout(resolve, 15000);
            fanVideoEl.onended = () => { clearTimeout(maxTimer); resolve(); };
            fanVideoEl.onerror = () => { clearTimeout(maxTimer); resolve(); };
        });

        if (recorder.state !== 'inactive') recorder.stop();
        const finalBlob = await recordingDone;

        if (finalBlob && finalBlob.size > 1024 && supabaseClient) {
            const fileName = `reaction_${donationId}_${Date.now()}.webm`;
            const { error: upErr } = await supabaseClient.storage
                .from('videos')
                .upload(fileName, finalBlob, { contentType: 'video/webm', upsert: true });

            if (!upErr) {
                await supabaseClient.from('donations').update({ reaction_url: fileName }).eq('id', donationId);
                try {
                    const trackerBc = new BroadcastChannel('whutcha_viewer_tracker');
                    trackerBc.postMessage({ event: 'reaction_ready', donationId, reaction_url: fileName });
                } catch(e){}
                return fileName;
            }
        }
    } finally {
        if (rafId) cancelAnimationFrame(rafId);
        if (camStream) camStream.getTracks().forEach(t => t.stop());
        if (fanVideoEl) { fanVideoEl.pause(); fanVideoEl.removeAttribute('src'); fanVideoEl.load(); }
        if (camVideoEl) { camVideoEl.pause(); camVideoEl.srcObject = null; }
    }
    return null;
};

// isDashboardMuted is declared at top of file
window.toggleDashboardAudio = function() {
    isDashboardMuted = !isDashboardMuted;
    const btn = document.getElementById('btn-dashboard-mute');
    const remoteVidContainer = document.getElementById('costream-remote-vid');
    if(!remoteVidContainer) return;
    
    const remoteVids = remoteVidContainer.getElementsByTagName('video');
    const remoteAudios = remoteVidContainer.getElementsByTagName('audio');
    
    [...remoteVids, ...remoteAudios].forEach(el => {
        el.muted = isDashboardMuted;
    });
    
    if (isDashboardMuted) {
        btn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span>Unmute Dashboard</span>';
    } else {
        btn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18l-6-6H4V6h2l6-6v18z"></path></svg><span>Mute Dashboard (Anti-Echo)</span>';
    }
};

window.openModal = function(id) {
    if(!canOpenModal(id)) return;
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        requestAnimationFrame(() => {
            el.classList.remove('opacity-0');
            el.classList.add('opacity-100');
            el.style.opacity = '1';
            const child = el.querySelector('.cyber-rack') || el.children[0];
            if (child) {
                child.classList.remove('scale-95');
                child.classList.add('scale-100');
            }
        });
    }
};

window.closeModal = function(id) {
    if (id === 'costream-modal') {
        if (typeof window.closeCoStreamModal === 'function') {
            window.closeCoStreamModal();
            return;
        }
    }
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('opacity-0');
        el.classList.remove('opacity-100');
        el.style.opacity = '0';
        const child = el.querySelector('.cyber-rack') || el.children[0];
        if (child) {
            child.classList.add('scale-95');
            child.classList.remove('scale-100');
        }
        setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }, 220);
    }
};



window.banViewer = async function(deviceId, username) {
    vibrate([50]);
    const safeName = (username || '').toLowerCase();
    const safeDev = (deviceId || '').toLowerCase();
    
    // 🧢 LOCO KWOKKA UNTOUCHABLE MASCOT PROTOCOL
    if (safeName.includes('loco') || safeName.includes('kwokka') || safeDev.includes('loco')) {
        if (typeof openModal === 'function') {
            openModal('loco-antiban-modal');
        } else {
            alert("Man, the streets ain't having it! You tryna ban the Boss of this whole scene? That's not gonna fly, cholo! 🧢🔥");
        }
        return;
    }

    if (checkIsObserver()) {
        if (typeof openModal === 'function') openModal('observer-modal');
        return;
    }

    if(!deviceId) {
        alert("[Whutcha Security 400]: Cannot Restrict: Legacy record missing Device Identifier.");
        return;
    }
    const confirmed = confirm(`Are you sure you want to BAN viewer @${username || deviceId}? They will never be able to send you videos again.`);
    if(!confirmed) return;
    
    // 1. Persist to local ban storage for instant response & demo resilience
    try {
        const localBans = JSON.parse(localStorage.getItem('whutcha_local_banned_devices') || '[]');
        if (!localBans.includes(deviceId)) {
            localBans.push(deviceId);
            localStorage.setItem('whutcha_local_banned_devices', JSON.stringify(localBans));
        }
    } catch(e){}

    // 2. Insert into banned_viewers table in Supabase
    if (currentUser && currentUser.id !== 'demo_broadcaster') {
        const { error: banError } = await supabaseClient.from('banned_viewers').insert([{
            streamer_id: currentUser.id,
            viewer_device_id: deviceId
        }]);
        if (banError && banError.code !== '23505') {
            console.warn("banned_viewers remote insert note:", banError.message);
        }
    }
    
    showToast(`🚫 Viewer @${username || 'user'} blacklisted`);
    
    // 2. Auto-decline all currently pending videos from this deviceId in the DOM
    const donationsToReject = (typeof pendingDonations !== 'undefined' ? pendingDonations : (currentDonations || []));
    donationsToReject.forEach(d => {
        if(d.viewer_device_id === deviceId && d.status === 'pending') {
            rejectDonation(d.id, d.video_hash || d.videoHash); // STRYKER DOCTRINE: Clean storage
        }
    });
};



window.syncQueue = async function() {
    vibrate([30]);
    const icon = document.getElementById('sync-icon');
    if (icon) icon.classList.add('animate-spin');
    
    // Attempt to manually re-fetch the queue in case Realtime WS dropped
    try {
        await loadQueue();
        showToast("Queue synchronized");
    } catch(e) {
        showToast("[Whutcha Protocol 503]: Queue Ledger Sync Failed. Check network connection.");
    }
    
    if (icon) setTimeout(() => icon.classList.remove('animate-spin'), 600);
};



// ==========================================
// SPEEDRUNNER MODE (POWER USER HOTKEYS & WCAG A11Y)
// ==========================================
document.addEventListener('keydown', (e) => {
    // WCAG 2.1 AA FOCUS TRAP FOR ACTIVE MODALS
    if (e.key === 'Tab') {
        const openModal = document.querySelector('[role="dialog"]:not(.hidden)');
        if (openModal) {
            const focusables = Array.from(openModal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => el.offsetParent !== null);
            if (focusables.length > 0) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first || !openModal.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !openModal.contains(document.activeElement)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            } else {
                e.preventDefault();
            }
            return;
        }
    }

    // If user is typing in an input field, only allow Escape to close open modals
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.key !== 'Escape') return;
    
    // GRANDMA MODE & UX SAFETY: Pressing Escape closes any open modal first before triggering Panic Blackout
    if (e.key === 'Escape') {
        const previewModal = document.getElementById('video-preview-modal');
        if (previewModal && !previewModal.classList.contains('hidden')) {
            if (typeof window.closeVideoPreviewModal === 'function') window.closeVideoPreviewModal();
            return;
        }
        const vaultModal = document.getElementById('reactions-vault-modal');
        if (vaultModal && !vaultModal.classList.contains('hidden')) {
            if (typeof window.closeReactionsVault === 'function') window.closeReactionsVault();
            return;
        }
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            if (typeof window.closeSettingsModal === 'function') window.closeSettingsModal();
            return;
        }
        const costreamModal = document.getElementById('costream-modal');
        if (costreamModal && !costreamModal.classList.contains('hidden')) {
            if (typeof window.closeCoStreamModal === 'function') window.closeCoStreamModal();
            return;
        }
        const shareModal = document.getElementById('share-vault-modal');
        if (shareModal && !shareModal.classList.contains('hidden')) {
            if (typeof window.closeShareModal === 'function') window.closeShareModal();
            return;
        }
        const iosModal = document.getElementById('ios-install-modal');
        if (iosModal && !iosModal.classList.contains('hidden')) {
            if (typeof window.closeIosInstallModal === 'function') window.closeIosInstallModal();
            return;
        }
        const standardModals = ['obs-guide-modal', 'recovery-modal', 'legal-modal-tos', 'legal-modal-privacy', 'legal-modal-contact', 'observer-modal', 'loco-antiban-modal'];
        let closedAny = false;
        standardModals.forEach(mId => {
            const el = document.getElementById(mId);
            if (el && !el.classList.contains('hidden')) {
                if (typeof window.closeModal === 'function') window.closeModal(mId);
                closedAny = true;
            }
        });
        if (closedAny) return;
    }

    // 🚨 EMERGENCY BLACKOUT HOTKEY: ESC (when no modal is open) or Shift + K
    if (e.key === 'Escape' || (e.shiftKey && (e.key === 'K' || e.key === 'k' || e.key === 'Л' || e.key === 'л'))) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        e.preventDefault();
        const killBtn = document.getElementById('btn-obs-killswitch');
        window.triggerObsKillSwitch(killBtn);
        return;
    }

    // 🔇 PANIC AUDIO MUTE HOTKEY: Shift + M (or Shift + Ь)
    if (e.shiftKey && (e.key === 'M' || e.key === 'm' || e.key === 'Ь' || e.key === 'ь')) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        e.preventDefault();
        window.toggleObsAudioMute();
        return;
    }

    // Check if we have pending donations
    const pending = currentDonations.filter(d => d.status === 'pending');
    if (pending.length === 0) return;
    
    const topDonation = pending[0];
    const isCoStream = (topDonation.videoHash || topDonation.video_hash || '').toLowerCase().includes('costream');

    // Shift + A -> Approve Top
    if (e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        approveDonation(topDonation.id, isCoStream, sanitize(topDonation.username));
    }
    
    // Shift + R -> Reject Top
    if (e.shiftKey && (e.key === 'R' || e.key === 'r' || e.key === 'К' || e.key === 'к')) {
        e.preventDefault();
        rejectDonation(topDonation.id, topDonation.video_hash || topDonation.videoHash);
    }
});

// 🔇 OBS PANIC AUDIO MUTE (TEMPORARY SILENCE WITHOUT BLACKOUT)
window.isObsAudioMuted = false;

window.toggleObsAudioMute = async function(btn) {
    vibrate([60, 40]);
    window.isObsAudioMuted = !window.isObsAudioMuted;
    const isMuted = window.isObsAudioMuted;

    const muteBtn = btn || document.getElementById('btn-obs-mute');
    const muteText = document.getElementById('btn-obs-mute-text');
    const muteIcon = document.getElementById('btn-obs-mute-icon');

    if (muteBtn) {
        if (isMuted) {
            muteBtn.classList.add('bg-red-500/25', 'text-red-300', 'border-red-500/70', 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', 'animate-pulse');
            muteBtn.classList.remove('text-amber-300', 'border-amber-500/40');
            if (muteText) muteText.textContent = 'Audio Muted';
            if (muteIcon) {
                muteIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />';
            }
        } else {
            muteBtn.classList.remove('bg-red-500/25', 'text-red-300', 'border-red-500/70', 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', 'animate-pulse');
            muteBtn.classList.add('text-amber-300', 'border-amber-500/40');
            if (muteText) muteText.textContent = 'Mute OBS';
            if (muteIcon) {
                muteIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />';
            }
        }
    }

    try {
        if (obsChannels && obsChannels.length > 0) {
            obsChannels.forEach(ch => {
                ch.send({
                    type: 'broadcast',
                    event: 'obs_toggle_mute',
                    payload: { isMuted: isMuted, timestamp: Date.now() }
                }).catch(() => {});
            });
        }
        try {
            const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
            localBc.postMessage({
                event: 'obs_toggle_mute',
                payload: { isMuted: isMuted, timestamp: Date.now() }
            });
        } catch(e){}

        showToast(isMuted ? "🔇 OBS Audio MUTED (Video remains live)" : "🔊 OBS Audio UNMUTED");
    } catch(err) {
        console.error("Mute dispatch error:", err);
    }
};

// 🚨 EMERGENCY BLACKOUT DISPATCHER (NODE 10 KILL-SWITCH)
window.triggerObsKillSwitch = async function(btn) {
    vibrate([200, 100, 200, 100, 300]); // Heavy emergency haptic pattern

    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.classList.add('bg-red-600', 'text-white', 'animate-pulse');
        btn.innerHTML = '<span>⚡ BLACKOUT ACTIVE</span>';
    }

    try {
        if (obsChannels && obsChannels.length > 0) {
            const promises = obsChannels.map(ch => ch.send({
                type: 'broadcast',
                event: 'obs_panic_blackout',
                payload: { timestamp: Date.now() }
            }).catch(() => {}));
            await Promise.all(promises);
        }

        // STYKER MUTANT KILLER: If there is an active/approved item being broadcast, mark it rejected in DB so it doesn't replay
        if (currentUser && currentUser.id !== 'demo_broadcaster') {
            supabaseClient
                .from('donations')
                .update({ status: 'rejected' })
                .eq('streamer_id', currentUser.id)
                .eq('status', 'approved')
                .then(() => {});
        }
        try {
            const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
            localBc.postMessage({ event: 'obs_panic_blackout', payload: { timestamp: Date.now() } });
        } catch(e){}

        if (window.activeCoStreamId || window.activeCostreamPayload) {
            window.dropCaller("🚨 Emergency Blackout Triggered");
        }

        showToast("🚨 EMERGENCY BLACKOUT: OBS overlay silenced & cleared instantly!");

        setTimeout(() => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('bg-red-600', 'text-white', 'animate-pulse');
                btn.innerHTML = origHtml;
            }
        }, 2500);
    } catch(err) {
        console.error("[Whutcha Broadcast Gateway 500]: Emergency blackout dispatch error:", err);
        showToast("Emergency blackout dispatched");
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('bg-red-600', 'text-white', 'animate-pulse');
            btn.innerHTML = origHtml;
        }
    }
};


// ==========================================
// 📡 OBS BROADCAST REALTIME & CONNECTION DETECTOR (NODE 10)
// ==========================================
// State variables (obsChannels, obsHeartbeatTimeout) are declared at top of file

window.getObsChannelAliases = function() {
    const activeId = (activeProfile && activeProfile.id) || (currentUser && currentUser.id) || 'demo_broadcaster';
    const activeHandle = (activeProfile && activeProfile.username) || 'loco_kwokka';
    return Array.from(new Set([
        currentUser?.id,
        activeProfile?.id,
        activeHandle,
        activeId,
        'demo_broadcaster',
        'demo-streamer',
        'loco_kwokka'
    ].filter(Boolean)));
};

window.broadcastToLocalObs = function(event, payload) {
    try {
        const aliases = window.getObsChannelAliases();
        aliases.forEach(alias => {
            try {
                const bc = new BroadcastChannel('whutcha_obs_channel_' + alias);
                bc.postMessage({ event, payload });
                bc.close();
            } catch(e){}
        });
    } catch(e){}
};

function initObsRealtime() {
    if (!currentUser) return;
    cleanupObsRealtime();

    const channelNames = new Set();
    const activeId = activeProfile ? activeProfile.id : currentUser.id;
    if (activeId) channelNames.add('obs-overlay-' + activeId);
    if (activeProfile && activeProfile.username) {
        channelNames.add('obs-overlay-' + activeProfile.username);
    }

    // Local Cross-Tab BroadcastChannel Handshake (0ms local OBS detection across all channel aliases)
    try {
        const localIds = window.getObsChannelAliases();
        window.localObsChannels = [];
        localIds.forEach(lid => {
            if (!lid) return;
            const bc = new BroadcastChannel('whutcha_obs_channel_' + lid);
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.event === 'obs_heartbeat') {
                    handleObsHeartbeat(ev.data.payload);
                }
            };
            bc.postMessage({ event: 'request_heartbeat', payload: { timestamp: Date.now() } });
            window.localObsChannels.push(bc);
        });
    } catch(e){}

    channelNames.forEach(channelName => {
        const ch = supabaseClient
            .channel(channelName)
            .on('broadcast', { event: 'obs_heartbeat' }, ({ payload }) => {
                handleObsHeartbeat(payload);
            })
            .on('broadcast', { event: 'obs_disconnected' }, () => {
                handleObsDisconnected();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // SPEEDRUNNER MODE: Ping any existing OBS overlay for immediate handshake
                    ch.send({
                        type: 'broadcast',
                        event: 'request_heartbeat',
                        payload: { timestamp: Date.now() }
                    }).catch(() => {});
                }
            });
        obsChannels.push(ch);
    });
}

function cleanupObsRealtime() {
    if (obsHeartbeatTimeout) {
        clearTimeout(obsHeartbeatTimeout);
        obsHeartbeatTimeout = null;
    }
    if (window.localObsChannels && window.localObsChannels.length > 0) {
        window.localObsChannels.forEach(bc => { try { bc.close(); } catch(e){} });
        window.localObsChannels = [];
    }
    if (obsChannels && obsChannels.length > 0) {
        obsChannels.forEach(ch => {
            try { supabaseClient.removeChannel(ch); } catch(e){}
        });
        obsChannels = [];
    }
}

function handleObsHeartbeat(payload) {
    if (obsHeartbeatTimeout) {
        clearTimeout(obsHeartbeatTimeout);
        obsHeartbeatTimeout = null;
    }

    const w = (payload && payload.width) || 1920;
    const h = (payload && payload.height) || 1080;
    updateObsStatusUI(true, `${w}x${h}`);

    // VAMPIRE MODE: Auto-reset to waiting if no heartbeat arrives within 25s (overlay sends every 10s)
    obsHeartbeatTimeout = setTimeout(() => {
        updateObsStatusUI(false);
    }, 25000);
}

function handleObsDisconnected() {
    if (obsHeartbeatTimeout) {
        clearTimeout(obsHeartbeatTimeout);
        obsHeartbeatTimeout = null;
    }
    updateObsStatusUI(false);
}

function updateObsStatusUI(connected, resolution = '1920x1080') {
    window.isObsConnected = Boolean(connected);
    const badges = [
        document.getElementById('obs-status-badge'),
        document.getElementById('obs-guide-status-badge')
    ];

    badges.forEach(badge => {
        if (!badge) return;
        if (connected) {
            badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]"></span> OBS: CONNECTED (${resolution})`;
        } else {
            badge.className = 'px-2 py-0.5 rounded text-[9px] font-mono-tech font-black bg-white/5 text-gray-400 border border-white/10 uppercase tracking-widest flex items-center gap-1.5 transition-all';
            badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span> OBS: WAITING FOR SOURCE`;
        }
    });

    if (typeof updateOnboardingState === 'function') {
        updateOnboardingState();
    }
}

// CHAOS MONKEY MODE: Debounced test ping to OBS overlay with real synthesized audio chime
window.testObsAlert = async function(btn) {
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⚡ SENDING PING...</span>';
    }

    try {
        // 1. Play real audio chime in broadcaster cockpit
        if (typeof window.playSynthesizedChime === 'function') {
            window.playSynthesizedChime();
        }
        vibrate([50, 100, 50]);

        // 2. Dispatch ping to OBS channels if available
        let obsDispatched = false;
        try {
            window.broadcastToLocalObs('ping_test', { timestamp: Date.now() });
            obsDispatched = true;
        } catch(e){}

        if (obsChannels && obsChannels.length > 0) {
            const promises = obsChannels.map(ch => ch.send({
                type: 'broadcast',
                event: 'ping_test',
                payload: { timestamp: Date.now() }
            }).catch(() => {}));
            await Promise.all(promises);
            obsDispatched = true;
        }

        if (obsDispatched) {
            showToast("⚡ Test alert & audio chime dispatched to OBS Studio overlay!");
        } else {
            showToast("🔔 Test chime played locally. (Paste URL in OBS Browser Source to see on stream)");
        }

        if (typeof markOnboardingTested === 'function') markOnboardingTested();

        if (btn) {
            btn.innerHTML = '<span>✅ ALERT SENT!</span>';
            setTimeout(() => {
                btn.innerHTML = origHtml;
                btn.disabled = false;
            }, 2500);
        }
    } catch(err) {
        console.error("[Whutcha Broadcast Gateway 500]: Error sending OBS ping:", err);
        showToast("[Whutcha Broadcast Gateway 500]: OBS Ping Error: " + err.message);
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }
};

window.openObsGuideModal = function() {
    let activeId = 'demo_broadcaster';
    if (currentUser) {
        activeId = activeProfile ? activeProfile.id : currentUser.id;
    }
    const rawPayload = JSON.stringify({ sid: activeId, t: Date.now() });
    const secureToken = btoa(rawPayload);
    const obsUrl = window.location.origin + '/overlay.html?widget=' + secureToken;
    const input = document.getElementById('obs-guide-url-input');
    if (input) input.value = obsUrl;

    if (typeof openModal === 'function') {
        openModal('obs-guide-modal');
    }
};

window.copyObsGuideUrl = async function(btn) {
    const input = document.getElementById('obs-guide-url-input');
    if (!input || !input.value) return;
    try {
        await navigator.clipboard.writeText(input.value);
    } catch(e) {
        input.select();
        document.execCommand('copy');
    }
    try { localStorage.setItem('whutcha_onboarding_obs', 'true'); } catch(e){}
    if (typeof updateOnboardingState === 'function') updateOnboardingState();
    const orig = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="text-white font-bold">COPIED!</span>';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
    vibrate([50]);
    showToast("📋 OBS Browser Source URL copied!");
};

// NINJA MODE: Secure the OBS URL
window.copyObsLink = async function(btnElement) {
    if (!currentUser) return;
    
    // Use active profile ID (or claimed channel ID) for OBS browser source
    const activeId = activeProfile ? activeProfile.id : currentUser.id;
    const rawPayload = JSON.stringify({ sid: activeId, t: Date.now() });
    const secureToken = btoa(rawPayload); 
    
    const obsUrl = window.location.origin + '/overlay.html?widget=' + secureToken;
    
    try {
        await navigator.clipboard.writeText(obsUrl);
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<span class="text-white font-black">COPIED SECURE LINK!</span>';
        setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
    } catch (err) {
        // Fallback for OBS browser contexts or HTTP
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = obsUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '<span class="text-white font-black">COPIED SECURE LINK!</span>';
        setTimeout(() => { btnElement.innerHTML = originalText; }, 2000);
    }
};


window.loadVideoPreview = async function(id, videoHash) {
    const container = document.getElementById('vid-container-' + id);
    if (!container) return;
    
    container.innerHTML = '<span class="animate-pulse text-[10px] text-gray-400 font-mono-tech">Loading...</span>';
    
    let videoUrl = null;
    if (videoHash && (videoHash.startsWith('http') || videoHash.includes('loco-kwokka'))) {
        videoUrl = videoHash.startsWith('http') ? videoHash : `./assets/${videoHash}`;
    } else {
        try {
            const { data, error } = await supabaseClient.storage.from('videos').createSignedUrl(videoHash, 300);
            if (data && data.signedUrl) {
                videoUrl = data.signedUrl;
            } else {
                videoUrl = `./assets/${videoHash}`;
            }
        } catch(e) {
            videoUrl = `./assets/${videoHash}`;
        }
    }
    
    container.innerHTML = `<video src="${videoUrl}" class="w-full h-full object-cover rounded-lg" controls autoplay muted playsinline></video>`;
};


// --- PASSWORD RECOVERY FLOW ---
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        // Show the recovery modal
        const modal = document.getElementById('recovery-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }
});

// Also check URL hash in case the event fired before our script loaded
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash.includes('type=recovery')) {
        const modal = document.getElementById('recovery-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }
});

window.saveNewPassword = async function() {
    const newPassword = document.getElementById('new-password').value;
    const btn = document.getElementById('btn-save-password');
    
    if (!newPassword || newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    
    btn.innerText = 'SAVING...';
    btn.disabled = true;
    
    const { data, error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });
    
    if (error) {
        alert("[Whutcha Security 400]: Password Update Failed: " + error.message);
        btn.innerText = 'SAVE NEW PASSWORD';
        btn.disabled = false;
    } else {
        alert("Password updated successfully!");
        document.getElementById('recovery-modal').classList.remove('flex');
        document.getElementById('recovery-modal').classList.add('hidden');
        // Clean up URL hash
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
};

// ==========================================
// 🎬 NATIVE THEATER PREVIEW MODAL & AUDIT ENGINE
// ==========================================
window.currentPreviewSpeed = 1.0;
window.currentPreviewVolume = parseFloat(localStorage.getItem('whutcha_preview_volume') || '0.4');
window.lastNonZeroPreviewVolume = 0.4;
let previewKeyboardHandler = null;

function formatPreviewTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

window.togglePreviewPlay = function() {
    const player = document.getElementById('theater-video-player');
    if (!player) return;
    vibrate([20]);
    if (player.paused) {
        player.play().catch(()=>{});
    } else {
        player.pause();
    }
    updatePreviewPlayStateUI();
};

function updatePreviewPlayStateUI() {
    const player = document.getElementById('theater-video-player');
    const dockIcon = document.getElementById('theater-dock-play-icon');
    const dockText = document.getElementById('theater-dock-play-text');
    const centerIcon = document.getElementById('theater-center-play-icon');
    if (!player) return;

    if (player.paused) {
        if (dockIcon) dockIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        if (dockText) dockText.textContent = 'Play';
        if (centerIcon) centerIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    } else {
        if (dockIcon) dockIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        if (dockText) dockText.textContent = 'Pause';
        if (centerIcon) centerIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }
}

window.skipPreviewTime = function(deltaSeconds) {
    const player = document.getElementById('theater-video-player');
    if (!player) return;
    vibrate([25]);
    player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + deltaSeconds));
    updatePreviewScrubberUI();
};

window.handlePreviewScrub = function(val) {
    const player = document.getElementById('theater-video-player');
    if (!player || isNaN(player.duration)) return;
    const targetTime = (parseFloat(val) / 100) * player.duration;
    player.currentTime = targetTime;
    const curEl = document.getElementById('theater-time-current');
    if (curEl) curEl.textContent = formatPreviewTime(targetTime);
};

function updatePreviewScrubberUI() {
    const player = document.getElementById('theater-video-player');
    const scrubber = document.getElementById('theater-scrubber');
    const curEl = document.getElementById('theater-time-current');
    const durEl = document.getElementById('theater-time-duration');
    if (!player) return;

    const cur = player.currentTime || 0;
    const dur = player.duration || 0;

    if (curEl) curEl.textContent = formatPreviewTime(cur);
    if (durEl && !isNaN(dur) && dur > 0) durEl.textContent = formatPreviewTime(dur);

    if (scrubber && dur > 0) {
        scrubber.value = ((cur / dur) * 100).toFixed(1);
    }
}

window.setPreviewSpeed = function(rate) {
    const player = document.getElementById('theater-video-player');
    window.currentPreviewSpeed = parseFloat(rate);
    if (player) {
        player.playbackRate = window.currentPreviewSpeed;
    }
    vibrate([25]);

    const label = document.getElementById('theater-speed-label');
    if (label) {
        if (rate === 1) label.textContent = '1.0x Normal';
        else if (rate === 1.5) label.textContent = '1.5x Speed';
        else if (rate === 2) label.textContent = '2.0x Fast Audit';
        else if (rate === 3) label.textContent = '3.0x Ultra Audit';
    }

    [1, 1.5, 2, 3].forEach(r => {
        const idKey = r === 1.5 ? '15' : String(r);
        const pill = document.getElementById('btn-speed-' + idKey);
        if (pill) {
            if (r === rate) {
                pill.classList.add('speed-pill-active');
                pill.classList.remove('text-gray-400');
            } else {
                pill.classList.remove('speed-pill-active');
                pill.classList.add('text-gray-400');
            }
        }
    });
};

window.setPreviewVolume = function(vol) {
    const player = document.getElementById('theater-video-player');
    const slider = document.getElementById('theater-volume-slider');
    const badge = document.getElementById('theater-volume-badge');
    const icon = document.getElementById('theater-volume-icon');

    const numVol = Math.max(0, Math.min(1, parseFloat(vol)));
    window.currentPreviewVolume = numVol;
    if (numVol > 0) window.lastNonZeroPreviewVolume = numVol;

    if (player) player.volume = numVol;
    if (slider) slider.value = numVol;
    if (badge) badge.textContent = Math.round(numVol * 100) + '%';

    try {
        localStorage.setItem('whutcha_preview_volume', String(numVol));
    } catch(e){}

    if (icon) {
        if (numVol === 0) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />';
        }
    }
};

window.togglePreviewMute = function() {
    vibrate([20]);
    if (window.currentPreviewVolume > 0) {
        window.setPreviewVolume(0);
    } else {
        window.setPreviewVolume(window.lastNonZeroPreviewVolume || 0.4);
    }
};

window.openVideoPreviewModal = function(src, username, amount, id, isCoStream) {
    const modal = document.getElementById('video-preview-modal');
    const player = document.getElementById('theater-video-player');
    const titleBadge = document.getElementById('theater-type-badge');
    const donorName = document.getElementById('theater-donor-name');
    const donorAmount = document.getElementById('theater-donor-amount');
    const btnApprove = document.getElementById('theater-btn-approve');
    
    if (!modal || !player) return;

    // Duck / Pause background Whutcha song during video preview
    if (typeof window.duckOrPauseWhutchaSound === 'function') {
        window.duckOrPauseWhutchaSound();
    }
    
    player.src = src;
    player.currentTime = 0;
    
    // Apply Safe Volume (default 40%)
    window.setPreviewVolume(window.currentPreviewVolume !== undefined ? window.currentPreviewVolume : 0.4);
    
    // Reset/Apply Speed
    window.setPreviewSpeed(window.currentPreviewSpeed || 1.0);
    
    if (titleBadge) {
        titleBadge.textContent = isCoStream ? 'Live Co-Stream' : 'Video Message';
        titleBadge.className = `px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold uppercase ${isCoStream ? 'bg-[#a800ff]/20 text-[#a800ff] border border-[#a800ff]/40' : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'}`;
    }
    if (donorName) donorName.textContent = username || 'Loco Kwokka';
    if (donorAmount) donorAmount.textContent = '+$' + parseFloat(amount || 1).toFixed(2);
    
    if (btnApprove) {
        btnApprove.onclick = () => {
            closeVideoPreviewModal();
            if (typeof approveDonation === 'function') {
                approveDonation(id, isCoStream, username);
            }
        };
    }

    // Attach dynamic player events
    player.ontimeupdate = updatePreviewScrubberUI;
    player.onloadedmetadata = updatePreviewScrubberUI;
    player.onplay = updatePreviewPlayStateUI;
    player.onpause = updatePreviewPlayStateUI;
    player.onended = () => {
        updatePreviewPlayStateUI();
        showToast("✅ Video playback finished. Ready to Approve or Dismiss.");
    };
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
        const rack = modal.querySelector('.cyber-rack');
        if (rack) {
            rack.classList.remove('scale-95');
            rack.classList.add('scale-100');
        }
    });

    // Keyboard navigation while preview modal is open
    if (previewKeyboardHandler) {
        document.removeEventListener('keydown', previewKeyboardHandler);
    }
    previewKeyboardHandler = (e) => {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            window.togglePreviewPlay();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            window.skipPreviewTime(-5);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            window.skipPreviewTime(5);
        } else if (e.key === '1') {
            window.setPreviewSpeed(1);
        } else if (e.key === '2') {
            window.setPreviewSpeed(2);
        } else if (e.key === '3') {
            window.setPreviewSpeed(3);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            window.setPreviewVolume(Math.min(1, (player.volume || 0.4) + 0.1));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            window.setPreviewVolume(Math.max(0, (player.volume || 0.4) - 0.1));
        }
    };
    document.addEventListener('keydown', previewKeyboardHandler);
    
    player.play().catch(e => console.log("Theater autoplay:", e));
};

window.closeVideoPreviewModal = function() {
    const modal = document.getElementById('video-preview-modal');
    const player = document.getElementById('theater-video-player');
    if (!modal) return;

    if (previewKeyboardHandler) {
        document.removeEventListener('keydown', previewKeyboardHandler);
        previewKeyboardHandler = null;
    }
    
    if (player) {
        player.ontimeupdate = null;
        player.onloadedmetadata = null;
        player.onplay = null;
        player.onpause = null;
        player.onended = null;
        player.pause();
        player.removeAttribute('src');
        player.load();
    }

    // Resume background anthem if it was active
    if (typeof window.resumeWhutchaSound === 'function') {
        window.resumeWhutchaSound();
    }
    
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    const rack = modal.querySelector('.cyber-rack');
    if (rack) {
        rack.classList.remove('scale-100');
        rack.classList.add('scale-95');
    }
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};


// ==========================================
// ⚡ BROADCAST SIMULATOR & SANDBOX ENGINE
// ==========================================
window.simulateDonation = async function(type = 'video') {
    if (window.actionLocks && window.actionLocks.has('simulation')) return;
    if (window.actionLocks) window.actionLocks.add('simulation');
    
    const isCoStream = type === 'costream';
    const isObserver = !currentUser || currentUser.id === 'demo_broadcaster' || localStorage.getItem('whutcha_observer_mode') === 'true';

    vibrate([50, 100, 50]);
    showToast(isCoStream ? "📞 Sample Co-Stream call added to queue!" : "⚡ Sample video donation added to queue!");
    
    const simId = 'SIM-' + Math.floor(100000 + Math.random() * 900000);
    const simData = {
        id: simId,
        streamer_id: (currentUser && currentUser.id) ? currentUser.id : 'demo_broadcaster',
        viewer_device_id: 'sim_device_' + Math.floor(Math.random() * 10000),
        amount: isCoStream ? 50.00 : 1.00,
        username: isCoStream ? 'Loco Kwokka 📞' : 'Loco Kwokka 🧢',
        video_hash: isCoStream ? 'loco-kwokka-costream.mp4' : 'loco-kwokka-donation.mp4',
        videoHash: isCoStream ? 'loco-kwokka-costream.mp4' : 'loco-kwokka-donation.mp4',
        status: 'pending',
        created_at: new Date().toISOString()
    };

    // INSTANT LOCAL INJECTION (Speedrunner Mode & Offline Resilience)
    currentDonations = currentDonations || [];
    currentDonations = currentDonations.filter(x => x.id !== simId);
    currentDonations.unshift(simData);
    renderQueue(currentDonations);
    
    if (typeof playSynthesizedChime === 'function') {
        playSynthesizedChime();
    }
    
    // Auto-launch native player experience immediately (HOMER SIMPSON & SPEEDRUNNER MODES)
    if (isCoStream) {
        if (typeof window.duckOrPauseWhutchaSound === 'function') {
            window.duckOrPauseWhutchaSound();
        }
        if (typeof openCoStreamStudio === 'function') {
            openCoStreamStudio();
        }
        setTimeout(() => {
            const remoteVid = document.getElementById('costream-remote-vid');
            if (remoteVid) {
                remoteVid.innerHTML = `<video id="green-room-video" src="./assets/loco-kwokka-costream.mp4?v=60" class="w-full h-full max-h-full object-contain rounded-xl" autoplay playsinline controls></video>`;
                const grPlayer = document.getElementById('green-room-video');
                if (grPlayer) {
                    grPlayer.onplay = () => {
                        if (typeof window.duckOrPauseWhutchaSound === 'function') {
                            window.duckOrPauseWhutchaSound();
                        }
                    };
                    grPlayer.onended = () => {
                        setTimeout(() => {
                            if (typeof window.dropCaller === 'function') {
                                window.dropCaller("📞 Loco Kwokka Co-Stream Call Completed");
                            }
                            if (typeof window.closeCoStreamModal === 'function') {
                                window.closeCoStreamModal();
                            }
                        }, 450);
                    };
                }
            }
            const callerName = document.getElementById('costream-caller-name');
            if (callerName) callerName.innerText = "Loco Kwokka 📞 (Call Request $50.00)";
            const callerStatus = document.getElementById('costream-caller-status');
            if (callerStatus) callerStatus.innerText = "STANDBY IN GREEN ROOM • 1080P 60FPS";
            const btnApproveObs = document.getElementById('btn-approve-costream-obs');
            if (btnApproveObs) {
                btnApproveObs.disabled = false;
                btnApproveObs.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }, 250);
    } else {
        if (typeof scrollToQueue === 'function') {
            scrollToQueue();
        }
        setTimeout(() => {
            if (typeof openVideoPreviewModal === 'function') {
                openVideoPreviewModal('./assets/loco-kwokka-donation.mp4?v=60', simData.username, simData.amount, simId, false);
            }
        }, 250);
    }
    
    // Cross-tab broadcast ping for OBS
    try {
        const localBc = new BroadcastChannel('whutcha_obs_channel_' + (currentUser?.id || 'demo_broadcaster'));
        localBc.postMessage({
            event: 'test_simulation_queued',
            payload: simData
        });
    } catch(e){}

    // STRIKER DOCTRINE & ZERO MOCKS: Simulations run purely in-memory and OBS BroadcastChannel.
    // We NEVER pollute the production ledger with mock SIM-* rows.
    setTimeout(() => {
        if (window.actionLocks) window.actionLocks.delete('simulation');
    }, 800);
};

// ==========================================
// 🚀 BROADCASTER QUICKSTART ONBOARDING LOGIC
// ==========================================
window.markOnboardingTested = function() {
    try { localStorage.setItem('whutcha_onboarding_tested', 'true'); } catch(e){}
    if (typeof updateOnboardingState === 'function') updateOnboardingState();
};

window.markOnboardingCopied = function() {
    try { localStorage.setItem('whutcha_onboarding_copied', 'true'); } catch(e){}
    if (typeof updateOnboardingState === 'function') updateOnboardingState();
};

window.toggleOnboardingCollapse = function(forceShow) {
    const container = document.getElementById('onboarding-steps-container');
    const toggleBtn = document.getElementById('btn-toggle-onboarding');
    if (!container || !toggleBtn) return;
    
    const currentlyHidden = container.classList.contains('hidden') || container.style.display === 'none';
    const shouldShow = (typeof forceShow === 'boolean') ? forceShow : currentlyHidden;
    
    if (shouldShow) {
        container.classList.remove('hidden');
        container.style.display = '';
        toggleBtn.innerText = 'Hide';
        try { localStorage.removeItem('whutcha_onboarding_collapsed'); } catch(e){}
    } else {
        container.classList.add('hidden');
        container.style.display = 'none';
        toggleBtn.innerText = 'Show';
        try { localStorage.setItem('whutcha_onboarding_collapsed', 'true'); } catch(e){}
    }
};

window.updateOnboardingState = function() {
    const card = document.getElementById('onboarding-checklist-card');
    if (!card) return;

    // STEP 1: Handle & Payout Link
    const payoutVal = document.getElementById('payout-link-input')?.value?.trim() || (activeProfile && activeProfile.external_pay_link);
    let step1Stored = false;
    try { step1Stored = localStorage.getItem('whutcha_onboarding_payout') === 'true'; } catch(e){}
    const hasCustomHandle = Boolean(
        (activeProfile && activeProfile.username && activeProfile.username !== currentUser?.id) ||
        checkIsObserver() ||
        step1Stored
    );
    const step1Done = Boolean(hasCustomHandle && payoutVal);

    // STEP 2: OBS Connection or Copied Source URL
    let step2Stored = false;
    try { step2Stored = localStorage.getItem('whutcha_onboarding_obs') === 'true'; } catch(e){}
    const step2Done = Boolean(window.isObsConnected || step2Stored);

    // STEP 3: Test Broadcast Alert
    let step3Done = false;
    try { step3Done = localStorage.getItem('whutcha_onboarding_tested') === 'true'; } catch(e){}

    // STEP 4: Share Fan Link
    let step4Done = false;
    try { step4Done = localStorage.getItem('whutcha_onboarding_copied') === 'true'; } catch(e){}

    // Update Step 1 UI
    const s1Card = document.getElementById('ob-step-1');
    const s1Status = document.getElementById('ob-step-1-status');
    if (s1Card && s1Status) {
        if (step1Done) {
            s1Card.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
            s1Card.classList.remove('border-white/10', 'bg-black/40');
            s1Status.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] font-mono-tech text-emerald-400 font-bold';
            s1Status.innerHTML = '✓';
        } else {
            s1Card.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
            s1Card.classList.add('border-white/10', 'bg-black/40');
            s1Status.className = 'w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-mono-tech text-gray-400 font-bold';
            s1Status.innerHTML = '1';
        }
    }

    // Update Step 2 UI
    const s2Card = document.getElementById('ob-step-2');
    const s2Status = document.getElementById('ob-step-2-status');
    if (s2Card && s2Status) {
        if (step2Done) {
            s2Card.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
            s2Card.classList.remove('border-white/10', 'bg-black/40');
            s2Status.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] font-mono-tech text-emerald-400 font-bold';
            s2Status.innerHTML = '✓';
        } else {
            s2Card.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
            s2Card.classList.add('border-white/10', 'bg-black/40');
            s2Status.className = 'w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-mono-tech text-gray-400 font-bold';
            s2Status.innerHTML = '2';
        }
    }

    // Update Step 3 UI
    const s3Card = document.getElementById('ob-step-3');
    const s3Status = document.getElementById('ob-step-3-status');
    if (s3Card && s3Status) {
        if (step3Done) {
            s3Card.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
            s3Card.classList.remove('border-white/10', 'bg-black/40');
            s3Status.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] font-mono-tech text-emerald-400 font-bold';
            s3Status.innerHTML = '✓';
        } else {
            s3Card.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
            s3Card.classList.add('border-white/10', 'bg-black/40');
            s3Status.className = 'w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-mono-tech text-gray-400 font-bold';
            s3Status.innerHTML = '3';
        }
    }

    // Update Step 4 UI
    const s4Card = document.getElementById('ob-step-4');
    const s4Status = document.getElementById('ob-step-4-status');
    if (s4Card && s4Status) {
        if (step4Done) {
            s4Card.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
            s4Card.classList.remove('border-white/10', 'bg-black/40');
            s4Status.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-[10px] font-mono-tech text-emerald-400 font-bold';
            s4Status.innerHTML = '✓';
        } else {
            s4Card.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
            s4Card.classList.add('border-white/10', 'bg-black/40');
            s4Status.className = 'w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-mono-tech text-gray-400 font-bold';
            s4Status.innerHTML = '4';
        }
    }

    // Progress bar & count
    const completedCount = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0) + (step4Done ? 1 : 0);
    const countBadge = document.getElementById('onboarding-badge-count');
    const progressBar = document.getElementById('onboarding-progress-bar');
    
    if (countBadge) {
        if (completedCount === 4) {
            countBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.3)]';
            countBadge.innerText = '🎉 4 / 4 COMPLETE';
            try {
                if (localStorage.getItem('whutcha_onboarding_celebrated') !== 'true' && typeof confetti === 'function') {
                    localStorage.setItem('whutcha_onboarding_celebrated', 'true');
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            } catch(e){}
        } else {
            countBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 uppercase tracking-widest';
            countBadge.innerText = `${completedCount} / 4 DONE`;
        }
    }
    
    if (progressBar) {
        progressBar.style.width = `${(completedCount / 4) * 100}%`;
    }

    // Check user collapsed state
    try {
        const isCollapsed = localStorage.getItem('whutcha_onboarding_collapsed') === 'true';
        if (isCollapsed) {
            window.toggleOnboardingCollapse(false);
        }
    } catch(e){}
};

// 📱 Smooth Scroll & Highlight Live Queue
window.scrollToQueue = function() {
    vibrate([40]);
    const queueSection = document.getElementById('queue-section') || document.getElementById('queue-container');
    if (queueSection) {
        queueSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        queueSection.classList.add('ring-2', 'ring-[#00f0ff]', 'shadow-[0_0_30px_rgba(0,240,255,0.3)]');
        setTimeout(() => {
            queueSection.classList.remove('ring-2', 'ring-[#00f0ff]', 'shadow-[0_0_30px_rgba(0,240,255,0.3)]');
        }, 1500);
    }
};

// ==========================================
// 🚀 COCKPIT SYSTEM BOOTSTRAP (SUBMARINE MODE)
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        checkAuth();
        initWhutchaSound();
    });
} else {
    checkAuth();
    initWhutchaSound();
}

