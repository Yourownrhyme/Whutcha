const fs = require('fs');

const flightRecorderScript = `
    <!-- Blackbox Flight Recorder (Telemetry) -->
    <script id="flight-recorder">
        (function() {
            const SUPABASE_URL = 'https://kjoffilncbybquvjytxx.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU';
            
            function sendTelemetry(msg, stack, severity = 'error') {
                try {
                    // Using native fetch (REST) so it works even if Supabase SDK crashes
                    fetch(SUPABASE_URL + '/rest/v1/telemetry_logs', {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: msg,
                            stack_trace: stack || 'No stack trace',
                            url: window.location.href,
                            user_agent: navigator.userAgent,
                            severity: severity
                        }),
                        keepalive: true // Send even if user closes the tab mid-crash
                    }).catch(e => console.error("Telemetry network error"));
                } catch(e) {}
            }

            window.onerror = function(message, source, lineno, colno, error) {
                sendTelemetry(message, error ? error.stack : \`\${source}:\${lineno}:\${colno}\`);
                return false;
            };

            window.addEventListener('unhandledrejection', function(event) {
                const msg = event.reason ? (event.reason.message || event.reason) : 'Unhandled Promise Rejection';
                const stack = event.reason ? event.reason.stack : '';
                sendTelemetry(msg.toString(), stack);
            });
        })();
    </script>
`;

// Patch viewer.html
let viewerHtml = fs.readFileSync('whutcha-web/viewer.html', 'utf8');
if (!viewerHtml.includes('flight-recorder')) {
    viewerHtml = viewerHtml.replace(/<head>/, '<head>\n' + flightRecorderScript);
    fs.writeFileSync('whutcha-web/viewer.html', viewerHtml);
}

// Patch dashboard.html
let dashHtml = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');
if (!dashHtml.includes('flight-recorder')) {
    dashHtml = dashHtml.replace(/<head>/, '<head>\n' + flightRecorderScript);
    fs.writeFileSync('whutcha-web/dashboard.html', dashHtml);
}

// Patch overlay.html
let overlayHtml = fs.readFileSync('whutcha-web/overlay.html', 'utf8');
if (!overlayHtml.includes('flight-recorder')) {
    overlayHtml = overlayHtml.replace(/<head>/, '<head>\n' + flightRecorderScript);
    fs.writeFileSync('whutcha-web/overlay.html', overlayHtml);
}

console.log("Mode 4 (Flight Recorder) patches applied to all HTML files.");
