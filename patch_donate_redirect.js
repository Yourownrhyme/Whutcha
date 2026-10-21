const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const oldSuccessLogic = `alert(\`Success! Your $\${amount} donation has been sent!\`);
                        retakeVideo();
                        document.getElementById('nickname').value = "";
                        submitBtn.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                        submitBtn.disabled = false;`;

const newSuccessLogic = `
                        // Fetch the streamer's payout link to redirect them
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('external_pay_link')
                            .eq('id', streamerId)
                            .single();
                            
                        if (profile && profile.external_pay_link) {
                            // Redirect to their DA/Kofi/Paypal
                            submitBtn.innerText = "REDIRECTING TO PAYMENT...";
                            window.top.location.href = profile.external_pay_link;
                        } else {
                            alert(\`Success! Your $\${amount} donation has been sent!\`);
                            retakeVideo();
                            document.getElementById('nickname').value = "";
                            submitBtn.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                            submitBtn.disabled = false;
                        }
`;

html = html.replace(oldSuccessLogic, newSuccessLogic);
fs.writeFileSync('whutcha-web/donate-v2.html', html);
