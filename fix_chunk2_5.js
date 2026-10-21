const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const oldListener = `                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'donations',
                    filter: 'id=eq.' + donationId
                }, async (payload) => {
                    const row = payload.new;
                    if (row.status === 'approved' && row.join_token) {`;

const newListener = `                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'donations',
                    filter: 'id=eq.' + donationId
                }, async (payload) => {
                    if (payload.eventType === 'DELETE' || (payload.eventType === 'UPDATE' && payload.new.status === 'rejected')) {
                        alert("The Streamer declined the Co-Stream request.");
                        window.location.reload();
                        return;
                    }
                    
                    const row = payload.new;
                    if (payload.eventType === 'UPDATE' && row && row.status === 'approved' && row.join_token) {`;

if (html.includes(oldListener)) {
    html = html.replace(oldListener, newListener);
    fs.writeFileSync('whutcha-web/viewer.html', html);
    console.log("Chunk 2.5 rejection fix injected.");
} else {
    console.log("Failed regex chunk 2.5");
}
