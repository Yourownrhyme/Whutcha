const fs = require('fs');
let html = fs.readFileSync('whutcha-web/donate-v2.html', 'utf8');

const oldInsert = `                    // Direct Supabase Insert instead of Edge Function for testing
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
                        .select();`;

const newInsert = `                    // Direct Supabase Insert matching exact DB columns
                    const customId = 'WTCH-' + Math.floor(100000 + Math.random() * 900000);
                    const { data: insertData, error: insertError } = await supabase
                        .from('donations')
                        .insert([
                            {
                                id: customId,
                                username: nickname,
                                amount: amount,
                                videoHash: generatedVideoHash,
                                video_hash: generatedVideoHash,
                                streamer_id: streamerId,
                                status: 'pending'
                            }
                        ])
                        .select();`;

html = html.replace(oldInsert, newInsert);
fs.writeFileSync('whutcha-web/donate-v2.html', html);
