import fs from 'fs';
const s = fs.readFileSync('C:/Users/RoshanSamarawickrema/Desktop/WMC-Master-Project/old-html/site.js', 'utf8');
let n = 0;
const lines = s.split(/\n/);
for (let i = 370; i < lines.length; i++) {
  for (const c of lines[i]) {
    if (c === '{') n++;
    if (c === '}') n--;
  }
  if (i < 395 || i > 900) console.log(`${i + 1}: depth=${n} ${lines[i].slice(0, 100)}`);
}
console.log('final depth', n);
