const base = "http://127.0.0.1:3100";

async function check(path, label, fn) {
  const html = await (await fetch(base + path)).text();
  const result = fn(html);
  console.log(label, result);
}

await check("/team-general-practitioners.html", "gp filters", (h) => ({
  toolbar: h.includes('data-gp-care-filters="true"'),
  golnarNew: /dr-golnar-mortezaei[\s\S]{0,800}New to Woolloongabba Medical Centre/.test(h) || /data-cms-practitioner="dr-golnar-mortezaei"[\s\S]{0,1200}New to Woolloongabba/.test(h),
  accepting: h.includes("Accepting New Patients"),
  careTags: h.includes("data-care-tags="),
}));

await check("/doctors/dr-golnar-mortezaei.html", "golnar profile", (h) => ({
  newBadge: h.includes("New to Woolloongabba Medical Centre"),
  accepting: h.includes("Accepting New Patients"),
  servicesProvided: /Services Provided|chronic-disease-care/.test(h),
  welcome: h.includes("welcome-dr-golnar"),
}));

await check("/doctors/dr-james.html", "james profile", (h) => ({
  newBadge: h.includes("New to Woolloongabba Medical Centre"),
  childrens: h.includes("childrens-health"),
}));

await check("/doctors/dr-yamesha-ranatunga.html", "yamesha profile", (h) => ({
  newBadge: h.includes("New to Woolloongabba Medical Centre"),
  womens: h.includes("womens-health"),
}));

await check("/services/womens-health.html", "womens service", (h) => ({
  yamesha: h.includes("dr-yamesha-ranatunga"),
}));

await check("/team.html", "team directory", (h) => ({
  filters: h.includes("data-gp-care-filters"),
  badges: h.includes("wmc-practitioner-badge"),
}));
