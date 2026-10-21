const fs = require('fs');
let dash = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const recoveryLogic = `
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
        alert("Failed to update password: " + error.message);
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
`;

if (!dash.includes('PASSWORD_RECOVERY')) {
    dash += '\n' + recoveryLogic;
    fs.writeFileSync('whutcha-web/dashboard.js', dash);
    console.log('dashboard.js patched with recovery logic.');
} else {
    console.log('Recovery logic already exists.');
}
