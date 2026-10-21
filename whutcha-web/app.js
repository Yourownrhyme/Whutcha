// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.error('SW registration failed!', err));
    });
}

// --- PWA Install Prompt Logic ---
let deferredPrompt;
const installBtn = document.getElementById('btn-install');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden'); // Show download button on supported browsers
});

if (installBtn) installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
    } else {
        // Fallback for iOS Safari which doesn't support beforeinstallprompt
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            alert('To install Whutcha: Tap the "Share" icon at the bottom of Safari, then tap "Add to Home Screen".');
        } else {
            alert('App is already installed or your browser does not support direct installation.');
        }
    }
});

// Always show button on iOS since `beforeinstallprompt` won't fire
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    if (installBtn) installBtn.classList.remove('hidden');
}


// --- UI Flow Logic ---
const authScreen = document.getElementById('auth-screen');

// Initialize Supabase for Auth
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(
    'https://kjoffilncbybquvjytxx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU'
);

// Capture ?claim=... and ?bounty=... from URL and display Escrow Bounty card
const urlParams = new URLSearchParams(window.location.search);
const claimParam = urlParams.get('claim');
const bountyParam = urlParams.get('bounty');
if (claimParam) {
    try { sessionStorage.setItem('whutcha_claim_streamer', claimParam); } catch(e){}
    
    // Dynamic page title & OpenGraph metadata
    document.title = `🔥 Fan Video Message Waiting for @${claimParam} | Whutcha`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `🔥 Fan Video Message Waiting for @${claimParam}!`);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', `🔥 Fan Video Message Waiting for @${claimParam}!`);

    // Render Escrow Alert Card
    const landingCard = document.getElementById('escrow-landing-card');
    if (landingCard) {
        landingCard.classList.remove('hidden');
        landingCard.classList.add('flex');
        const titleEl = document.getElementById('escrow-landing-title');
        const descEl = document.getElementById('escrow-landing-desc');
        const avatarImg = document.getElementById('escrow-avatar-img');
        const avatarBox = document.getElementById('escrow-avatar-box');
        
        let displayHandle = claimParam;
        const displayAmount = bountyParam ? `$${parseFloat(bountyParam).toFixed(2)}` : 'Pending Video Message';
        if (titleEl) titleEl.innerText = `${displayAmount} for @${claimParam}`;
        if (descEl) descEl.innerText = `A viewer sent a video donation for your channel! Register or sign in below to preview in the green room and broadcast live to OBS.`;
        
        // Fetch creator profile if claimParam is UUID or username
        supabase.from('profiles')
            .select('id, username, avatar_url')
            .or(`id.eq.${claimParam},username.ilike.${claimParam}`)
            .maybeSingle()
            .then(({ data: profileData }) => {
                if (profileData) {
                    displayHandle = profileData.username || claimParam;
                    if (titleEl) titleEl.innerText = `${displayAmount} for @${displayHandle}`;
                    if (avatarImg && profileData.avatar_url) {
                        avatarImg.src = profileData.avatar_url;
                    }
                }
            }).catch(() => {});

        // Live RPC fetch for actual total pool
        supabase.rpc('get_streamer_escrow_pool', { p_streamer_id: claimParam })
            .then(({ data }) => {
                if (data && parseFloat(data.total_amount) > 0) {
                    const totalFormatted = `$${parseFloat(data.total_amount).toFixed(2)}`;
                    if (titleEl) titleEl.innerText = `${totalFormatted} in Fan Tips Waiting for @${displayHandle}`;
                    document.title = `🔥 ${totalFormatted} Waiting for @${displayHandle} | Whutcha`;
                    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `🔥 ${totalFormatted} Waiting for @${displayHandle}!`);
                    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', `🔥 ${totalFormatted} Waiting for @${displayHandle}!`);
                }
            }).catch(() => {});
    }
}

async function checkSession() {
    // If user explicitly requested registration or came to claim a channel, DO NOT auto-redirect to dashboard
    try {
        const hash = window.location.hash.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        const isRegisterMode = hash === '#register' || urlParams.get('mode') === 'register' || urlParams.get('register') === 'true' || urlParams.has('claim');
        if (isRegisterMode) {
            return;
        }
    } catch(e){}

    // If user explicitly signed out, suppress auto-bounce and finalize local signout
    try {
        if (sessionStorage.getItem('whutcha_logged_out') === 'true') {
            sessionStorage.removeItem('whutcha_logged_out');
            await supabase.auth.signOut({ scope: 'local' });
            return;
        }
    } catch(e) {}

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            window.location.href = './dashboard.html';
        }
    } catch (err) {
        console.error("Auth init error:", err);
    }
}
checkSession();

// Element References
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');

const btnEmailSignin = document.getElementById('btn-email-signin');
const btnEmailSignup = document.getElementById('btn-email-signup');
const btnForgotPassword = document.getElementById('btn-forgot-password');

function safeSetFlag(key, val) {
    try { sessionStorage.setItem(key, val); } catch (e) {}
}

window.signInOAuth = async (provider) => {
    if (!validateTerms()) return;
    safeSetFlag('whutcha_just_logged_in', 'true');
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + window.location.pathname.replace(/\/index\.html$/, '') + '/dashboard.html'
        }
    });
    if (error) {
        console.error('Error logging in:', error);
        alert(error.message);
    }
};


function validateTerms() {
    const checkbox = document.getElementById('terms-checkbox');
    const authError = document.getElementById('auth-error');
    if (checkbox && !checkbox.checked) {
        const termsLabel = document.getElementById('terms-label');
        if (termsLabel) {
            termsLabel.classList.add('border-red-500/80', 'bg-red-500/10');
            setTimeout(() => {
                termsLabel.classList.remove('border-red-500/80', 'bg-red-500/10');
            }, 1800);
        }
        if(typeof showAuthMessage === "function") { 
            showAuthMessage("Please accept the Terms of Use and Privacy Policy to continue.", true); 
        } else if(authError) { 
            authError.textContent = "Please accept the Terms of Use and Privacy Policy to continue."; 
            authError.className = "mb-4 p-3 border rounded-xl text-xs font-mono font-bold text-center bg-red-500/20 border-red-500/50 text-red-200"; 
            authError.classList.remove('hidden');
        } else {
            alert("Please accept the Terms of Use and Privacy Policy to continue.");
        }
        return false;
    }
    return true;
}

function clearObserverMockData() {
    const observerKeys = [
        'whutcha_observer_mode',
        'streamerID',
        'whutcha_onboarding_payout',
        'whutcha_onboarding_obs',
        'whutcha_onboarding_tested',
        'whutcha_onboarding_copied',
        'whutcha_onboarding_celebrated',
        'whutcha_onboarding_collapsed',
        'whutcha_demo_paylink',
        'whutcha_demo_handle',
        'whutcha_dismissed_sims',
        'whutcha_vault_mock_reactions'
    ];
    observerKeys.forEach(k => {
        try { localStorage.removeItem(k); } catch(e){}
    });
}

function showAuthMessage(msg, isError) {
    if(!authError) return;
    authError.textContent = msg;
    authError.className = 'mb-4 p-3.5 border rounded-xl text-xs font-mono font-bold text-center transition-all ' + 
        (isError ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400');
    authError.classList.remove('hidden');
}

async function handleEmailAuth(isSignUp) {
    if (!authError || !emailInput || !passwordInput) return;
    if (!validateTerms()) return;
    authError.classList.add('hidden');
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        showAuthMessage("Please enter both email and password.", true);
        return;
    }
    
    const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
        
    if (error) {
        showAuthMessage(error.message, true);
    } else {
        safeSetFlag('whutcha_just_logged_in', 'true');
        clearObserverMockData();
        window.location.href = './dashboard.html';
    }
}

window.handleAuthFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const hash = window.location.hash.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const isRegister = hash === '#register' || urlParams.get('mode') === 'register' || urlParams.get('register') === 'true';
    handleEmailAuth(isRegister);
};

if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!passwordInput.value) {
                passwordInput.focus();
            } else {
                window.handleAuthFormSubmit();
            }
        }
    });
}
if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            window.handleAuthFormSubmit();
        }
    });
}


if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', async () => {
        if (!authError || !emailInput) return;
        
        const email = emailInput.value.trim();
        if (!email) {
            showAuthMessage("Please enter your email address first.", true);
            return;
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname.replace(/\/index\.html$/, '') + '/dashboard.html'
        });
        
        if (error) {
            showAuthMessage(error.message, true);
        } else {
            showAuthMessage("Password reset link sent to your email!", false);
        }
    });
}

if (btnEmailSignin) {
    btnEmailSignin.addEventListener('click', () => handleEmailAuth(false));
}
if (btnEmailSignup) {
    btnEmailSignup.addEventListener('click', () => handleEmailAuth(true));
}

// --- Sidebar Logic ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');



// --- Video Carousel Logic ---
const videos = document.querySelectorAll('.carousel-vid');
let currentVidIdx = 0;

if (videos.length > 1) {
    setInterval(() => {
        // Fade out current
        videos[currentVidIdx].classList.remove('opacity-100');
        videos[currentVidIdx].classList.add('opacity-0');
        
        // Move to next
        currentVidIdx = (currentVidIdx + 1) % videos.length;
        
        // Fade in next
        videos[currentVidIdx].classList.remove('opacity-0');
        videos[currentVidIdx].classList.add('opacity-100');
    }, 10000); // 10 seconds
}







// ==========================================
// OFFLINE DETECTION
// ==========================================
function updateOnlineStatus() {
    let banner = document.getElementById('offline-banner');
    if (!navigator.onLine) {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offline-banner';
            banner.className = 'fixed top-0 left-0 w-full bg-red-600/90 backdrop-blur text-white text-center py-1 text-xs font-bold z-[9999] tracking-widest uppercase';
            banner.innerText = '🔴 You are offline. Reconnecting automatically...';
            document.body.prepend(banner);
        }
    } else {
        if (banner) banner.remove();
        // If we came back online on the dashboard, auto-sync
        if (window.location.pathname.includes('dashboard') && typeof fetchPendingQueue === 'function') {
            fetchPendingQueue();
        }
    }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
// Initial check
if (document.readyState === 'complete') {
    updateOnlineStatus();
} else {
    window.addEventListener('load', updateOnlineStatus);
}



// ==========================================
// ERROR BOUNDARY
// ==========================================
window.showFatalError = function(errorMsg = "Unexpected Error") {
    if (document.getElementById('fatal-error-screen')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fatal-error-screen';
    overlay.className = 'fixed inset-0 z-[10000] bg-dark flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl';
    
    overlay.innerHTML = `
        <div class="max-w-md w-full glass-card border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-widest">Connection Interrupted</h2>
            <p class="text-silver text-sm mb-6 font-bold">Something went wrong while loading this view. Please reload the page.</p>
            <div class="bg-black/50 p-4 rounded-xl text-left mb-8 overflow-hidden border border-white/5 max-h-32 overflow-y-auto">
                <code class="text-[10px] text-red-400 font-mono break-words">${errorMsg}</code>
            </div>
            <button onclick="window.location.reload()" class="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                Reload Page
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
};

window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || event.reason || "Unhandled Promise Rejection";
    const msgStr = msg.toString();
    // Ignore minor/expected background errors
    if (msgStr.includes('AbortError') || msgStr.includes('realtime') || msgStr.includes('fetch')) return;
    
    console.error('FATAL PROMISE REJECTION:', event.reason);
    showFatalError(msgStr);
});

window.addEventListener('error', (event) => {
    const msgStr = event.message || "";
    // Ignore non-fatal browser quirks
    if (msgStr.includes('ResizeObserver') || msgStr.includes('Script error')) return;
    
    console.error('FATAL JS ERROR:', event.error);
    showFatalError(msgStr);
});
