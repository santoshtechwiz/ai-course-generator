#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CSS_PATH = path.join(ROOT, 'globals.css');
// broaden search paths so we catch usages across the repo
const SEARCH_PATHS = [
	path.join(ROOT, 'app'),
	path.join(ROOT, 'components'),
	path.join(ROOT, 'modules'),
	path.join(ROOT, 'lib'),
	path.join(ROOT, 'services'),
	path.join(ROOT, 'pages'),
	path.join(ROOT, 'providers'),
	path.join(ROOT, 'scripts')
];
const LOG_PATH = path.join(ROOT, 'scripts', 'find-unused-css.log');

function readCss() {
	if (!fs.existsSync(CSS_PATH)) return '';
	return fs.readFileSync(CSS_PATH, 'utf8');
}

function collectClassSelectors(css) {
	const classSet = new Set();
		// naive regex: match .class-name or .class_name or .class123 (skip leading .. and pseudo)
		const regex = /\.([a-zA-Z0-9_-]+)(?=[\s,{:.#>\[])/g;
	let m;
	while ((m = regex.exec(css)) !== null) {
			const token = m[1];
			// filter heuristics: skip tokens that start with a digit (likely timing/util tokens like 0.3s)
			// and skip very short tokens (1-2 chars) which are unlikely to be deliberate named classes
			if (/^[0-9]/.test(token)) continue;
			if (token.length <= 2) continue;
			classSet.add(token);
	}
	return Array.from(classSet).sort();
}

function walk(dir, fileCallback) {
	if (!fs.existsSync(dir)) return;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const ent of entries) {
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) walk(full, fileCallback);
		else if (ent.isFile()) fileCallback(full);
	}
}

function searchUsages(classes) {
	const usage = new Map();
	for (const c of classes) usage.set(c, 0);

		const exts = new Set(['.jsx', '.tsx', '.js', '.ts', '.html', '.md', '.mdx']);

	for (const base of SEARCH_PATHS) {
		walk(base, (file) => {
			if (!exts.has(path.extname(file))) return;
			const content = fs.readFileSync(file, 'utf8');
			for (const cls of classes) {
				// look for className="...cls..." or class="...cls..." or ` ${cls}` in template
				const re = new RegExp(`\\b${cls}\\b`);
				if (re.test(content)) usage.set(cls, usage.get(cls) + 1);
			}
		});
	}

	return usage;
}

function main() {
	const css = readCss();
	if (!css) {
		console.error('globals.css not found or empty');
		process.exit(2);
	}

	const classes = collectClassSelectors(css);
	console.log(`Found ${classes.length} unique class-like selectors in globals.css`);

	const usageMap = searchUsages(classes);

	const unused = classes.filter((c) => (usageMap.get(c) || 0) === 0);

	const report = [];
	report.push(`Scan run: ${new Date().toISOString()}`);
	report.push(`Searched paths: ${SEARCH_PATHS.join(', ')}`);
	report.push(`Total selectors scanned: ${classes.length}`);
	report.push(`Unused selectors: ${unused.length}`);
	if (unused.length > 0) {
		report.push('---');
		report.push(...unused.map((u) => `UNUSED: .${u}`));
	} else {
		report.push('No unused selectors found.');
	}

	fs.writeFileSync(LOG_PATH, report.join('\n') + '\n', 'utf8');
	console.log(report.join('\n'));

	if (unused.length > 0) process.exit(1);
}

main();
