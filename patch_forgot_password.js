const fs = require('fs');

// --- 1. Patch index.html ---
let indexHtml = fs.readFileSync('whutcha-web/index.html', 'utf8');

// We need to inject the forgot password link
const forgotPasswordLink = `
                <input type="password" id="auth-password" placeholder="Password" class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors font-bold">
                <div class="flex justify-end mt-1">
                    <button id="btn-forgot-password" class="text-xs text-silver hover:text-primary transition-colors font-bold tracking-wide">Forgot password?</button>
                </div>
`;
indexHtml = indexHtml.replace(/<input type="password" id="auth-password"[^>]+>/, forgotPasswordLink);

// We need to clean the auth-error div to be reusable for success messages
indexHtml = indexHtml.replace(
    /<div id="auth-error" class="hidden mb-4 p-3 bg-red-500\/20 border border-red-500\/50 rounded-xl text-red-200 text-sm font-bold text-center"><\/div>/,
    '<div id="auth-error" class="hidden mb-4 p-3 border rounded-xl text-sm font-bold text-center transition-colors"></div>'
);

fs.writeFileSync('whutcha-web/index.html', indexHtml);
console.log('Patched index.html');

// --- 2. Patch app.js ---
let appJs = fs.readFileSync('whutcha-web/app.js', 'utf8');

// Declare new elements
appJs = appJs.replace(
    "const btnEmailSignup = document.getElementById('btn-email-signup');",
    "const btnEmailSignup = document.getElementById('btn-email-signup');\nconst btnForgotPassword = document.getElementById('btn-forgot-password');"
);

// Helper function to show error/success
const helperFunctions = `
function showAuthMessage(msg, isError) {
    if(!authError) return;
    authError.textContent = msg;
    authError.className = 'mb-4 p-3 border rounded-xl text-sm font-bold text-center transition-colors ' + 
        (isError ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200');
}
`;

appJs = appJs.replace('async function handleEmailAuth', helperFunctions + '\nasync function handleEmailAuth');

// Update handleEmailAuth to use the new helper
appJs = appJs.replace(
    /authError\.textContent = error\.message;\s*authError\.classList\.remove\('hidden'\);/g,
    'showAuthMessage(error.message, true);'
);

// Add the forgot password listener
const forgotPasswordLogic = `
if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', async () => {
        if (!authError || !emailInput) return;
        
        const email = emailInput.value.trim();
        if (!email) {
            showAuthMessage("Please enter your email address first.", true);
            return;
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname.replace(/\\/index\\.html$/, '') + '/dashboard.html'
        });
        
        if (error) {
            showAuthMessage(error.message, true);
        } else {
            showAuthMessage("Password reset link sent to your email!", false);
        }
    });
}
`;

appJs = appJs.replace('if (btnEmailSignin) {', forgotPasswordLogic + '\nif (btnEmailSignin) {');

fs.writeFileSync('whutcha-web/app.js', appJs);
console.log('Patched app.js');
