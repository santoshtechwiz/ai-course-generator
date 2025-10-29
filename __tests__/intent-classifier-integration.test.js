/**
 * Test script for integrated IntentClassifier with NLP
 */

const { IntentClassifier } = require('../dist/app/services/chat/IntentClassifier');

async function testIntegratedClassifier() {
  console.log('🚀 Testing Integrated IntentClassifier with NLP\n');

  // Create classifier instance
  const classifier = new IntentClassifier();

  // Wait a bit for NLP initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test cases
  const testCases = [
    { input: 'hello there', expectedIntent: 'off_topic' },
    { input: 'I want to learn Python programming', expectedIntent: 'navigate_course' },
    { input: 'give me a quiz please', expectedIntent: 'navigate_quiz' },
    { input: 'how are you doing', expectedIntent: 'general_help' }, // Should fallback
    { input: 'show me machine learning courses', expectedIntent: 'navigate_course' }
  ];

  console.log('🧪 Running integration tests:\n');

  let passed = 0;
  let total = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = await classifier.classify(testCase.input);

    const success = result.intent === testCase.expectedIntent;
    if (success) passed++;

    console.log(`Test ${i + 1}: "${testCase.input}"`);
    console.log(`  Expected: ${testCase.expectedIntent}`);
    console.log(`  Got: ${result.intent} (confidence: ${result.confidence.toFixed(3)})`);
    console.log(`  ✅ ${success ? 'PASS' : 'FAIL'}`);
    console.log('');
  }

  console.log(`📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All integration tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
testIntegratedClassifier().catch(error => {
  console.error('❌ Integration test failed with error:', error);
  process.exit(1);
});