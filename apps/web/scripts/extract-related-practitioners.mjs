const html = await (await fetch("http://127.0.0.1:3100/services/womens-health.html")).text();
const m = html.match(/id="related-practitioners"[\s\S]*?<\/section>/i);
console.log(m ? m[0] : "missing");
const card = await (await fetch("http://127.0.0.1:3100/updates/index.html")).text();
const a = card.match(/<article class="health-update-card">[\s\S]*?<\/article>/i);
console.log("\nCARD\n", a ? a[0] : "missing");
