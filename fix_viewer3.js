const fs = require('fs');
let html = fs.readFileSync('whutcha-web/viewer.html', 'utf8');

const badBlock = `                } catch (err) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '0%';
                    alert("Error: " + err.message);
                    btnText.innerText = \`SEND FOR \${amount.toFixed(2)}\`;
                    submitBtn.disabled = false;
                }

                    }
                } catch (err) {
                    alert("Error: " + err.message);
                    submitBtn.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                    submitBtn.disabled = false;
                }`;

const newBlock = `                } catch (err) {
                    clearInterval(progressInterval);
                    progressBar.style.width = '0%';
                    alert("Error: " + err.message);
                    btnText.innerText = \`SEND FOR $\${amount.toFixed(2)}\`;
                    submitBtn.disabled = false;
                }`;

html = html.replace(/\} catch \(err\) \{[\s\S]*?submitBtn.disabled = false;\s*\}/m, newBlock);
fs.writeFileSync('whutcha-web/viewer.html', html);
console.log("viewer.html fixed duplicate catch block");
