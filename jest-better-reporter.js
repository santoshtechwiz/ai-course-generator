const chalk = require('chalk');

class BetterReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    
    // Silence console logs during tests unless debug mode is enabled
    if (!this._options.debug) {
      const originalConsole = global.console;
      global.console = {
        ...originalConsole,
        log: () => {},
        info: () => {},
        warn: () => {},
        error: originalConsole.error, // Keep error logging
      };
    }
  }

  onRunComplete(contexts, results) {
    const { numTotalTests, numPassedTests, numFailedTests, numPendingTests, testResults } = results;
    const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);
    
    console.log('\n' + chalk.bold.cyan('🧪 Test Summary:'));
    console.log('═'.repeat(50));
    
    console.log(`${chalk.green('✓')} ${chalk.green.bold(numPassedTests)} tests passed ${chalk.grey(`(${duration}s)`)}`)
    
    if (numFailedTests > 0) {
      console.log(`${chalk.red('✗')} ${chalk.red.bold(numFailedTests)} tests failed`);
    }
    
    if (numPendingTests > 0) {
      console.log(`${chalk.yellow('○')} ${chalk.yellow.bold(numPendingTests)} tests pending`);
    }
    
    if (numFailedTests > 0) {
      console.log('\n' + chalk.bold.red('Failed Tests:'));
      console.log('─'.repeat(50));
      
      testResults.forEach(testResult => {
        testResult.testResults.forEach(test => {
          if (test.status === 'failed') {
            console.log(`\n${chalk.red('✗')} ${chalk.white.bold(test.title)}`);
            console.log(`  ${chalk.dim(testResult.testFilePath)}`);
            
            const error = test.failureMessages[0];
            const errorMessage = error.split('\n')[0];
            console.log(`  ${chalk.red.dim(errorMessage)}\n`);
          }
        });
      });
    }
    
    console.log('═'.repeat(50) + '\n');
  }
}

module.exports = BetterReporter;
