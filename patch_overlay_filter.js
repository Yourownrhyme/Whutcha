const fs = require('fs');
let html = fs.readFileSync('whutcha-web/overlay.html', 'utf8');

const badFilter = "filter: `status=eq.approved&streamer_id=eq.${streamerId}`";
const goodFilter = "filter: `streamer_id=eq.${streamerId}`";

html = html.replace(badFilter, goodFilter);

const oldCallbackStart = `}, payload => {
                    const donation = payload.new;
                    console.log("New approved donation:", donation);`;

const newCallbackStart = `}, payload => {
                    const donation = payload.new;
                    if (donation.status !== 'approved') return;
                    console.log("New approved donation:", donation);`;

html = html.replace(oldCallbackStart, newCallbackStart);

fs.writeFileSync('whutcha-web/overlay.html', html);
