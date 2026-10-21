const fs = require('fs');
let js = fs.readFileSync('whutcha-web/dashboard.js', 'utf8');

const walletLogic = `
// ==========================================
// WALLET / PAYOUT LINK LOGIC
// ==========================================
async function loadPayoutLink() {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('external_pay_link')
        .eq('id', currentUser.id)
        .single();
        
    if (data && data.external_pay_link) {
        document.getElementById('payout-link-input').value = data.external_pay_link;
    }
}

window.savePayoutLink = async () => {
    const link = document.getElementById('payout-link-input').value;
    if (!link) return;
    
    const btn = event.currentTarget;
    btn.innerText = 'SAVING...';
    
    const { error } = await supabaseClient
        .from('profiles')
        .update({ external_pay_link: link })
        .eq('id', currentUser.id);
        
    if (error) {
        alert("Error saving link: " + error.message);
        btn.innerText = 'SAVE';
    } else {
        btn.innerText = 'SAVED!';
        setTimeout(() => btn.innerText = 'SAVE', 2000);
    }
};
`;

js = js.replace('async function loadQueue() {', walletLogic + '\nasync function loadQueue() {');
js = js.replace('loadQueue();', 'loadQueue();\n        loadPayoutLink();');

fs.writeFileSync('whutcha-web/dashboard.js', js);
