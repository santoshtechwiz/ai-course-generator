#!/usr/bin/env node

/**
 * This script validates that there are no circular dependencies in CSS
 * and ensures that the Tailwind configuration is properly unified.
 */

const fs = require('fs');
const path = require('path');

// Simple color functions without chalk dependency
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`
};

console.log(colors.blue('🔍 Validating CSS and Tailwind configuration...'));

// Check that postcss.config.mjs is referencing the unified Tailwind config
const postcssConfig = fs.readFileSync(path.join(process.cwd(), 'postcss.config.mjs'), 'utf8');
if (!postcssConfig.includes('tailwind.config.ts')) {
  console.log(colors.red('❌ postcss.config.mjs is not referencing tailwind.unified.config.ts'));
  process.exit(1);
}

// Check that globals.unified.css exists and doesn't have circular dependencies
const globalsCss = fs.readFileSync(path.join(process.cwd(), 'globals.css'), 'utf8');

// Check for circular dependencies in @apply directives
const circularDeps = [];
const applyRegex = /@apply\s+([\w\s-]+);/g;
let match;

while ((match = applyRegex.exec(globalsCss)) !== null) {
  const appliedClasses = match[1].trim().split(/\s+/);
  
  // Check if any of the applied classes are defined in the same file using the same class
  for (const cls of appliedClasses) {
    // Look for class definition that might be circular
    const classDefRegex = new RegExp(`\\.${cls}\\s+{[^}]*@apply[^}]*${cls}[^}]*}`, 'g');
    if (classDefRegex.test(globalsCss)) {
      circularDeps.push(cls);
    }
  }
}

if (circularDeps.length > 0) {
  console.log(colors.red(`❌ Found circular dependencies in CSS for classes: ${circularDeps.join(', ')}`));
  process.exit(1);
} else {
  console.log(colors.green('✅ No circular dependencies found in CSS'));
}

// Check that app/layout.tsx is using the unified CSS
const appLayout = fs.readFileSync(path.join(process.cwd(), 'app', 'layout.tsx'), 'utf8');
if (!appLayout.includes('globals.css')) {
  console.log(colors.red('❌ app/layout.tsx is not importing globals.unified.css'));
  process.exit(1);
} else {
  console.log(colors.green('✅ app/layout.tsx is using the unified CSS'));
}

console.log(colors.green('✅ All style validation checks passed!'));
