const base = "http://127.0.0.1:3100";

async function check(path, tests) {
  const html = await (await fetch(base + path)).text();
  const results = {};
  for (const [name, re] of Object.entries(tests)) {
    results[name] = re.test(html);
  }
  console.log(path, results);
}

await check("/services/womens-health.html", {
  yamesha: /dr-yamesha-ranatunga/,
  noGolnar: /^((?!dr-golnar-mortezaei).)*$/s, // entire page without golnar — use includes inverse below
});
{
  const html = await (await fetch(base + "/services/womens-health.html")).text();
  console.log("womens yamesha", html.includes("dr-yamesha-ranatunga"), "golnarAbsent", !html.includes("dr-golnar-mortezaei"));
}
{
  const html = await (await fetch(base + "/services/chronic-disease-care.html")).text();
  console.log("chronic golnar", html.includes("dr-golnar-mortezaei"), "yamesha", html.includes("dr-yamesha-ranatunga"));
}
{
  const html = await (await fetch(base + "/services/childrens-health.html")).text();
  console.log("childrens james", html.includes("dr-james.html"));
}
{
  const html = await (await fetch(base + "/services/mental-health.html")).text();
  console.log("mental james", html.includes("dr-james.html"));
}
{
  const html = await (await fetch(base + "/updates/index.html")).text();
  console.log("index golnar welcome", html.includes("welcome-dr-golnar"), "james welcome", html.includes("welcome-dr-james"));
}
{
  const html = await (await fetch(base + "/updates/welcome-dr-golnar-mortezaei.html")).text();
  console.log("welcome golnar→profile", html.includes("dr-golnar-mortezaei.html"), "→chronic", html.includes("chronic-disease-care"));
}
{
  const html = await (await fetch(base + "/updates/welcome-dr-james-chanaka.html")).text();
  console.log("welcome james→profile", html.includes("dr-james.html"), "hotdoc", /hotdoc\.com/i.test(html));
}
{
  const html = await (await fetch(base + "/doctors/dr-golnar-mortezaei.html")).text();
  console.log("profile→welcome", html.includes("welcome-dr-golnar-mortezaei"));
}
{
  const html = await (await fetch(base + "/doctors/dr-james.html")).text();
  console.log("james profile→welcome", html.includes("welcome-dr-james-chanaka"));
}
