import fs from 'fs';
import { spawnSync } from 'child_process';

const lines = fs.readFileSync('old-html/site.js', 'utf8').split(/\n/);
const dir = '.tmp-pdf-convert';

function check(name, text) {
  const path = `${dir}/${name}.js`;
  fs.writeFileSync(path, text);
  const r = spawnSync('node', ['--check', path], { encoding: 'utf8' });
  console.log(name + ':', r.status === 0 ? 'OK' : (r.stderr || r.stdout).trim().split('\n')[0]);
}

const join = (a, b) => lines.slice(a, b).join('\n') + '\n';

// Outer from 376 through booking close 952, no outer close
check('t1-unclosed', join(375, 952));
// Same + close outer
check('t2-closed', join(375, 952) + '})();\n');
// Through 4C close, no final })();
check('t3-4c-no-final', join(375, 1094));
// Through 4C + final
check('t4-full-from-376', join(375, lines.length));
// Only 4C standalone (dedented conceptually - as written nested)
check('t5-4c-only', join(955, 1094));
// Full file
check('t6-full', fs.readFileSync('old-html/site.js', 'utf8'));
// File without final })();
check('t7-no-final', lines.slice(0, 1094).join('\n') + '\n');
// File with 4C as top-level after closing... rebuild
const rebuilt =
  lines.slice(0, 952).join('\n') +
  '\n})();\n\n' +
  lines.slice(953, 1094).join('\n').replace(/^\s{2}/gm, '') +
  '\n';
check('t8-rebuilt', rebuilt);
