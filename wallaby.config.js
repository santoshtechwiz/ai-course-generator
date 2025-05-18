module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.+(ts|tsx|js|jsx|json|snap)',
      '!src/**/*.test.(ts|tsx|js|jsx)'
    ],

    tests: [
      'src/**/*.test.(ts|tsx|js|jsx)'
    ],

    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'jest',

    setup: function (wallaby) {
      const jestConfig = require('./jest.config'); // use .ts if needed and transpile
      wallaby.testFramework.configure(jestConfig);
    }
  };
};
