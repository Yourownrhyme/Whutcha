const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const oldFetchStart = `const functionUrl = 'https://kjoffilncbybquvjytxx.supabase.co/functions/v1/create-donation';`;
const oldFetchEnd = `const donationId = result.donation.id;`;

const newInsert = `
                    // Direct Supabase Insert instead of Edge Function for testing
                    const { data: insertData, error: insertError } = await supabase
                        .from('donations')
                        .insert([
                            {
                                username: nickname,
                                amount: amount,
                                video_hash: generatedVideoHash,
                                streamer_id: streamerId,
                                status: 'pending'
                            }
                        ])
                        .select();
                        
                    if (insertError) throw new Error(insertError.message);
                    if (!insertData || insertData.length === 0) throw new Error("Failed to create donation record");
                    
                    const donationId = insertData[0].id;
`;

// use regex to replace the block
const regex = new RegExp("const functionUrl = 'https://kjoffilncbybquvjytxx\\.supabase\\.co/functions/v1/create-donation';[\\s\\S]*?const donationId = result\\.donation\\.id;");
html = html.replace(regex, newInsert.trim());

fs.writeFileSync('whutcha-web/donate-v2.html', html);
