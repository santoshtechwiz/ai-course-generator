module.exports = function (wallaby) {
  return {
    files: [
      'store/**/*.+(ts|tsx|js|jsx|json|snap)',
      'lib/**/*.+(ts|tsx|js|jsx|json|snap)',
      'app/**/*.+(ts|tsx|js|jsx|json|snap)',
      '!app/**/*.test.(ts|tsx|js|jsx)'
    ],

    tests: [
      'app/**/*.test.(ts|tsx|js|jsx)'
    ],

    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'jest',

    setup: function (wallaby) {
      const jestConfig = require('./jest.config.ts'); // Ensure correct extension
      wallaby.testFramework.configure(jestConfig);
    }
  };
};
