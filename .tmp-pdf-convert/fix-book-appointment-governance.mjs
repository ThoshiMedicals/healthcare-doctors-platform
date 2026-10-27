import fs from 'node:fs';
const path = new URL('../old-html/book-appointment.html', import.meta.url);
let html = fs.readFileSync(path, 'utf8');
const host = '<div data-governance-review data-governance-page="book-appointment.html" hidden></div>';
if (!html.includes('data-governance-review')) {
  html = html.replace('</main>', `${host}</main>`);
}
if (!/governance-published\.js/.test(html)) {
  html = html.replace(
    /(<script\b[^>]*\bsrc=")([^"]*?)(site\.js)("[^>]*>\s*<\/script>)/i,
    (match, open, prefix, file, close) => `${open}${prefix}governance-published.js${close}${open}${prefix}${file}${close}`
  );
}
fs.writeFileSync(path, html);
console.log({
  host: html.includes('data-governance-page="book-appointment.html"'),
  script: /governance-published\.js/.test(html)
});
