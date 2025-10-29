/**
 * Simple test script for NlpIntentClassifier (JavaScript version)
 */

const { NlpIntentClassifier } = require('../app/services/chat/NlpIntentClassifier');

async function runTests() {
  console.log('🚀 Starting NlpIntentClassifier Tests\n');

  // Initialize classifier
  const classifier = new NlpIntentClassifier('./models/test-intents.nlp');

  // Add test intents
  console.log('📚 Adding intents...');
  classifier.addIntent('greeting', [
    'hello', 'hi', 'hey', 'greetings', 'good morning'
  ], ['Hello! How can I help you?']);

  classifier.addIntent('course.search', [
    'I want to learn JavaScript', 'show me Python courses', 'find React tutorials'
  ], ['I can help you find courses!']);

  classifier.addIntent('quiz.start', [
    'take a quiz', 'start quiz', 'test my knowledge'
  ], ['Let\'s start a quiz!']);

  // Train the model
  console.log('🎯 Training model...');
  await classifier.train();
  console.log('✅ Model trained successfully\n');

  // Test cases
  const testCases = [
    { input: 'hello there', expectedIntent: 'greeting' },
    { input: 'I want to learn Python programming', expectedIntent: 'course.search' },
    { input: 'give me a quiz please', expectedIntent: 'quiz.start' },
    { input: 'how are you doing', expectedIntent: 'unknown' },
    { input: 'show me machine learning courses', expectedIntent: 'course.search' }
  ];

  console.log('🧪 Running tests:\n');

  let passed = 0;
  let total = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = await classifier.predict(testCase.input);

    const success = result.intent === testCase.expectedIntent;
    if (success) passed++;

    console.log(`Test ${i + 1}: "${testCase.input}"`);
    console.log(`  Expected: ${testCase.expectedIntent}`);
    console.log(`  Got: ${result.intent} (score: ${result.score.toFixed(3)})`);
    console.log(`  ✅ ${success ? 'PASS' : 'FAIL'}`);
    if (result.response) {
      console.log(`  Response: "${result.response}"`);
    }
    console.log('');
  }

  console.log(`📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});