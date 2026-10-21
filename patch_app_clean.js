const fs = require('fs');
let js = fs.readFileSync('whutcha-web/app.js', 'utf8');

const newCheckSession = `async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            window.location.href = './dashboard.html';
        }
    } catch (err) {
        console.error("Auth init error:", err);
    }
}`;

js = js.replace(/async function checkSession\(\) \{[\s\S]*?checkSession\(\);/, newCheckSession + '\ncheckSession();');

// Remove sidebar functions and event listeners
js = js.replace(/function openSidebar\(\) \{[\s\S]*?function closeSidebar\(\) \{[\s\S]*?\}, 300\);\s*\}/, '');
js = js.replace(/const btnOpenSidebar = document\.getElementById\('btn-open-sidebar'\);[\s\S]*?overlay\.addEventListener\('click', closeSidebar\);/, '');

// Remove iframeReady listener
js = js.replace(/window\.addEventListener\('message', \(event\) => \{[\s\S]*?\}\);/, '');

fs.writeFileSync('whutcha-web/app.js', js);
