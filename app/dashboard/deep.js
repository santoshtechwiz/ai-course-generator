const { execSync } = require('child_process');
const depcheck = require('depcheck');

const options = {
  // Define special parsers if needed
  parsers: {
    '**/*.js': depcheck.parser.es6,
    '**/*.jsx': depcheck.parser.jsx,
    '**/*.ts': depcheck.parser.typescript,
    '**/*.tsx': depcheck.parser.typescript,
  },
  detectors: [
    depcheck.detector.requireCallExpression,
    depcheck.detector.importDeclaration,
  ],
  specials: [
    depcheck.special.eslint,
    depcheck.special.jest,
    depcheck.special.webpack,
  ],
};

depcheck(process.cwd(), options).then((result) => {
  const unusedDependencies = result.dependencies;
  const unusedDevDependencies = result.devDependencies;

  if (unusedDependencies.length === 0 && unusedDevDependencies.length === 0) {
    console.log('No unused dependencies found!');
    return;
  }

  console.log('Removing unused dependencies...');
  unusedDependencies.forEach((dep) => {
    console.log(`Uninstalling ${dep}...`);
    execSync(`npm uninstall ${dep}`, { stdio: 'inherit' });
  });

  unusedDevDependencies.forEach((dep) => {
    console.log(`Uninstalling dev dependency ${dep}...`);
    execSync(`npm uninstall --save-dev ${dep}`, { stdio: 'inherit' });
  });

  console.log('Unused dependencies removed successfully!');
});
