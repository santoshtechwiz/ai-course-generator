const chalk = require('chalk');

class BetterReporter {  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    this._startTime = Date.now();
    
    // Store original console for restoration later
    this._originalConsole = global.console;
    
    // Silence console logs during tests unless debug mode is enabled
    if (!this._options.debug) {
      global.console = {
        ...this._originalConsole,
        log: (this._options.keepLogs ? this._originalConsole.log : () => {}),
        info: () => {},
        warn: (this._options.keepLogs ? this._originalConsole.warn : () => {}),
        error: this._originalConsole.error, // Keep error logging
      };
    }
    
    // Print starting message
    console.log(chalk.cyan('\n🚀 Starting tests...\n'));
  }
  _getGroupedResults(testResults) {
    const groupedResults = {};
    
    testResults.forEach(testResult => {
      // Extract directory path
      const pathParts = testResult.testFilePath.split(/[\\/]/);
      let groupName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'root';
      
      // For special directory structures like (quiz), use parent directory
      if (groupName.startsWith('(') && groupName.endsWith(')') && pathParts.length > 2) {
        groupName = pathParts[pathParts.length - 3] + '/' + groupName;
      }
      
      if (!groupedResults[groupName]) {
        groupedResults[groupName] = {
          passed: 0,
          failed: 0,
          pending: 0,
          total: 0,
          duration: 0
        };
      }
      
      const group = groupedResults[groupName];
      
      testResult.testResults.forEach(test => {
        group.total++;
        group.duration += test.duration || 0;
        
        if (test.status === 'passed') {
          group.passed++;
        } else if (test.status === 'failed') {
          group.failed++;
        } else if (test.status === 'pending') {
          group.pending++;
        }
      });
    });
    
    return groupedResults;
  }
  onRunComplete(contexts, results) {
    // Restore original console
    if (!this._options.debug && this._originalConsole) {
      global.console = this._originalConsole;
    }
    
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
    
    // Display results by group
    const groupedResults = this._getGroupedResults(testResults);
    
    if (Object.keys(groupedResults).length > 1) {
      console.log('\n' + chalk.bold.cyan('Results by Directory:'));
      console.log('─'.repeat(50));
      
      // Format as a table
      console.log(`${chalk.dim('Directory'.padEnd(25))} | ${chalk.dim('Passed'.padEnd(8))} | ${chalk.dim('Failed'.padEnd(8))} | ${chalk.dim('Pending'.padEnd(8))} | ${chalk.dim('Duration')}`);
      console.log('─'.repeat(70));
      
      Object.entries(groupedResults)
        .sort(([, a], [, b]) => (b.failed - a.failed) || (b.total - a.total))
        .forEach(([name, data]) => {
          const durationText = (data.duration / 1000).toFixed(2) + 's';
          const passedText = data.passed > 0 ? chalk.green(data.passed.toString()) : '0';
          const failedText = data.failed > 0 ? chalk.red(data.failed.toString()) : '0';
          const pendingText = data.pending > 0 ? chalk.yellow(data.pending.toString()) : '0';
          
          console.log(
            `${name.padEnd(25).substring(0, 25)} | ${passedText.padEnd(8)} | ${failedText.padEnd(8)} | ${pendingText.padEnd(8)} | ${durationText}`
          );
        });
      
      console.log('─'.repeat(70));
    }
      if (numFailedTests > 0) {
      console.log('\n' + chalk.bold.red('Failed Tests:'));
      console.log('─'.repeat(50));
      
      testResults.forEach(testResult => {
        const failedTests = testResult.testResults.filter(test => test.status === 'failed');
        
        if (failedTests.length > 0) {
          console.log(`\n${chalk.yellow('File:')} ${chalk.dim(testResult.testFilePath)}`);
          
          failedTests.forEach(test => {
            console.log(`\n  ${chalk.red('✗')} ${chalk.white.bold(test.title)}`);
            
            const error = test.failureMessages[0];
            const errorLines = error.split('\n');
            const errorMessage = errorLines[0];
            console.log(`    ${chalk.red.dim(errorMessage)}`);
            
            // Extract and display the code snippet from the error
            const codeSnippet = errorLines.slice(1, 5).filter(line => line.trim().length > 0);
            if (codeSnippet.length > 0) {
              console.log(`    ${chalk.dim(codeSnippet.join('\n    '))}`);
            }
            
            // Try to extract the most useful part of the stack trace
            const stackTrace = errorLines.find(line => line.includes('at ') && !line.includes('node_modules'));
            if (stackTrace) {
              console.log(`    ${chalk.dim(stackTrace)}`);
            }
          });
          console.log(''); // Add extra space for readability
        }
      });
    }
      console.log('═'.repeat(50) + '\n');

    // Show slow tests if there are any tests that took longer than 1 second
    const slowTests = testResults
      .flatMap(testResult => 
        testResult.testResults
          .filter(test => test.duration > 1000)
          .map(test => ({
            name: test.title,
            path: testResult.testFilePath,
            duration: test.duration
          }))
      )
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    if (slowTests.length > 0) {
      console.log(chalk.bold.yellow('Slow Tests:'));
      console.log('─'.repeat(50));
      
      slowTests.forEach(test => {
        const durationSec = (test.duration / 1000).toFixed(2);
        console.log(`${chalk.yellow('⏱')}  ${chalk.white(test.name)} ${chalk.dim(`(${durationSec}s)`)}`);
      });
      
      console.log('─'.repeat(50) + '\n');
    }
    
    // Log overall pass/fail status
    if (numFailedTests === 0) {
      console.log(chalk.green.bold('✅ All tests passed!\n'));
    } else {
      console.log(chalk.red.bold(`❌ ${numFailedTests} tests failed.\n`));
    }
  }
}

module.exports = BetterReporter;
