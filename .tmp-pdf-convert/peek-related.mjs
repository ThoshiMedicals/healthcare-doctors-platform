import fs from 'fs';

function section(html, id) {
  const re = new RegExp(
    `<section[^>]*id="${id}"[^>]*>[\\s\\S]*?</section>`,
    'i'
  );
  const m = html.match(re);
  return m ? m[0] : null;
}

const skin = fs.readFileSync('old-html/services/skin-checks.html', 'utf8');
console.log('SKIN:\n', section(skin, 'related-practitioners')?.slice(0, 1800));

const art = fs.readFileSync(
  'old-html/knowledge/articles/understanding-type-2-diabetes.html',
  'utf8'
);
console.log('\nARTICLE:\n', section(art, 'related-practitioners')?.slice(0, 1500));

const chronic = fs.readFileSync('old-html/services/chronic-disease-care.html', 'utf8');
console.log('\nCHRONIC:\n', section(chronic, 'related-practitioners')?.slice(0, 1500));
