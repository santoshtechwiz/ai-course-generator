#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CSS_SRC = path.join(ROOT, 'globals.css');
const NEXT_CSS_DIR = path.join(ROOT, '.next', 'static', 'css');
const OUT_LOG = path.join(ROOT, 'scripts', 'find-unused-css-compiled.log');

function readCss() {
  if (!fs.existsSync(CSS_SRC)) return '';
  return fs.readFileSync(CSS_SRC, 'utf8');
}

function collectClassSelectors(css) {
  const classSet = new Set();
  const regex = /\.([a-zA-Z0-9_-]+)(?=[\s,{:.#>\[])/g;
  let m;
  while ((m = regex.exec(css)) !== null) {
    const token = m[1];
    if (/^[0-9]/.test(token)) continue;
    if (token.length <= 2) continue;
    classSet.add(token);
  }
  return Array.from(classSet).sort();
}

function readBuiltCss() {
  if (!fs.existsSync(NEXT_CSS_DIR)) return '';
  const files = fs.readdirSync(NEXT_CSS_DIR).filter(f => f.endsWith('.css'));
  let combined = '';
  for (const f of files) combined += fs.readFileSync(path.join(NEXT_CSS_DIR, f), 'utf8') + '\n';
  return combined;
}

function main() {
  const src = readCss();
  if (!src) {
    console.error('globals.css not found');
    process.exit(2);
  }
  const selectors = collectClassSelectors(src);
  console.log(`Found ${selectors.length} selectors in globals.css`);

  const built = readBuiltCss();
  if (!built) {
    console.error('.next compiled CSS not found. Run `npm run build` first.');
    process.exit(2);
  }

  const unused = [];
  for (const s of selectors) {
    const token = `.${s}`;
    if (!built.includes(token)) unused.push(s);
  }

  const lines = [];
  lines.push(`Scan (compiled) run: ${new Date().toISOString()}`);
  lines.push(`Total selectors scanned: ${selectors.length}`);
  lines.push(`Selectors not found in compiled CSS: ${unused.length}`);
  if (unused.length) {
    lines.push('---');
    lines.push(...unused.map(u => `UNUSED_COMPILED: .${u}`));
  }

  fs.writeFileSync(OUT_LOG, lines.join('\n') + '\n', 'utf8');
  console.log(lines.join('\n'));
  if (unused.length) process.exit(1);
}

main();
