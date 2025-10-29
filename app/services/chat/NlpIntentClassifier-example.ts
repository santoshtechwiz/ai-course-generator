/**
 * Sample usage of NlpIntentClassifier
 * Shows how to train and use the intent classifier
 */

import { NlpIntentClassifier } from './NlpIntentClassifier';

async function main() {
  // Create classifier instance
  const classifier = new NlpIntentClassifier('./models/chat-intents.nlp');

  // Add sample intents with training utterances and responses
  classifier.addIntent('greeting', [
    'hello',
    'hi there',
    'good morning',
    'hey',
    'greetings',
    'howdy',
    'hi',
    'hello there'
  ], [
    'Hello! How can I help you today?',
    'Hi there! What can I do for you?',
    'Greetings! How may I assist you?'
  ]);

  classifier.addIntent('course.search', [
    'I want to learn JavaScript',
    'show me Python courses',
    'find tutorials on React',
    'I need to learn Node.js',
    'courses about machine learning',
    'teach me about databases',
    'looking for web development courses',
    'find me a course on TypeScript'
  ], [
    'I can help you find courses on that topic!',
    'Let me show you some relevant courses.',
    'Great choice! Here are some courses that might interest you.'
  ]);

  classifier.addIntent('quiz.start', [
    'I want to take a quiz',
    'start a quiz',
    'test my knowledge',
    'give me a quiz',
    'practice questions',
    'assessment test',
    'begin quiz',
    'take assessment'
  ], [
    'Perfect! Let me start a quiz for you.',
    'Great! I\'ll prepare a quiz for you.',
    'Let\'s test your knowledge!'
  ]);

  // Train the model
  console.log('Training the model...');
  await classifier.train();
  console.log('Model trained successfully!');

  // Test predictions
  const testInputs = [
    'hello',
    'I want to learn Python',
    'give me a quiz',
    'what is machine learning',
    'show me courses'
  ];

  console.log('\nTesting predictions:');
  for (const input of testInputs) {
    const result = await classifier.predict(input);
    console.log(`Input: "${input}"`);
    console.log(`Intent: ${result.intent} (score: ${result.score.toFixed(2)})`);
    if (result.response) {
      console.log(`Response: ${result.response}`);
    }
    console.log('---');
  }
}

// Export for use in API routes
export { NlpIntentClassifier };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}