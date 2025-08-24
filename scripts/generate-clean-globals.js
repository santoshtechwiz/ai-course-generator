#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG = path.join(ROOT, 'scripts', 'find-unused-css.log');
const SRC = path.join(ROOT, 'globals.css');
const OUT = path.join(ROOT, 'globals.cleaned.css');

if (!fs.existsSync(LOG)) {
  console.error('find-unused-css.log not found. Run scripts/find-unused-css.js first.');
  process.exit(2);
}
if (!fs.existsSync(SRC)) {
  console.error('globals.css not found.');
  process.exit(2);
}

const log = fs.readFileSync(LOG, 'utf8');
const unused = Array.from(new Set(
  (log.match(/^UNUSED:\s*\.([a-zA-Z0-9_-]+)/gm) || [])
    .map((m) => m.replace(/^UNUSED:\s*\./, ''))
));

if (unused.length === 0) {
  console.log('No unused selectors found in log. Nothing to do.');
  process.exit(0);
}

const css = fs.readFileSync(SRC, 'utf8');
let out = css;

// For each unused selector, comment out its rule blocks in the CSS
for (const sel of unused) {
  // safe selector regex: match .sel and any following selectors on the same line
  const selectorRegex = new RegExp('(^|\\n)\\s*\\.' + sel + '(?:[^\\{\\n]*)\\{', 'g');
  let match;
  const indices = [];
  while ((match = selectorRegex.exec(out)) !== null) {
    const start = match.index + (match[1] ? match[1].length : 0);
    // find the opening brace
    const bracePos = out.indexOf('{', selectorRegex.lastIndex - 1);
    if (bracePos === -1) break;
    // walk to matching closing brace
    let depth = 1;
    let i = bracePos + 1;
    for (; i < out.length; i++) {
      if (out[i] === '{') depth++;
      else if (out[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    const end = i + 1; // include closing brace
    indices.push([start, end]);
    selectorRegex.lastIndex = end;
  }

  // Apply replacements in reverse order to not break indices
  for (let j = indices.length - 1; j >= 0; j--) {
    const [s, e] = indices[j];
    const snippet = out.slice(s, e);
    const commented = '/* COMMENTED OUT UNUSED: .' + sel + ' */\n' + snippet.split('\n').map(l => '/* ' + l + ' */').join('\n') + '\n';
    out = out.slice(0, s) + commented + out.slice(e);
  }
}

fs.writeFileSync(OUT, out, 'utf8');
console.log(`Wrote cleaned CSS to ${path.relative(ROOT, OUT)} with ${unused.length} selectors commented.`);
