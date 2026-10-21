const fs = require('fs');
let html = fs.readFileSync('whutcha-web/dashboard.html', 'utf8');

const walletHtml = `
            <!-- Wallet/Payout Link -->
            <div class="brutal-card p-6 flex flex-col justify-between relative overflow-hidden md:col-span-2 border-primary border-4">
                <div class="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
                    <div class="flex-1">
                        <h3 class="text-2xl font-black uppercase mb-2 text-primary">Payout Link</h3>
                        <p class="text-gray-400 font-bold mb-4 text-sm">Paste your DonationAlerts, PayPal.me, or Ko-fi link. Viewers will be redirected here after sending a video.</p>
                        <div class="flex gap-2">
                            <input type="url" id="payout-link-input" placeholder="https://donationalerts.com/r/yourname" class="brutal-input p-4 flex-1 text-sm text-white font-bold">
                            <button onclick="savePayoutLink()" class="brutal-btn-primary px-8 text-sm">SAVE</button>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 font-black uppercase tracking-widest md:text-right">
                        100% of money<br>goes directly to you
                    </div>
                </div>
            </div>
        </div>

        <!-- Queue Header -->
`;

html = html.replace('</div>\n\n        <!-- Queue Header -->', walletHtml);

fs.writeFileSync('whutcha-web/dashboard.html', html);
