/**
 * Next.js API Route Example
 * Shows how to integrate NlpIntentClassifier in an API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { NlpIntentClassifier } from '@/app/services/chat/NlpIntentClassifier';

// Initialize classifier (in production, this should be a singleton)
let classifier: NlpIntentClassifier | null = null;

async function getClassifier(): Promise<NlpIntentClassifier> {
  if (!classifier) {
    classifier = new NlpIntentClassifier('./models/chat-intents.nlp');

    // Add intents (in production, load from config/database)
    classifier.addIntent('greeting', [
      'hello', 'hi', 'hey', 'greetings', 'good morning', 'howdy'
    ], [
      'Hello! How can I help you with your learning today?',
      'Hi there! What would you like to learn?'
    ]);

    classifier.addIntent('course.search', [
      'I want to learn JavaScript', 'show me Python courses',
      'find tutorials on React', 'courses about machine learning'
    ], [
      'I can help you find courses on that topic!',
      'Let me show you some relevant courses.'
    ]);

    classifier.addIntent('quiz.start', [
      'take a quiz', 'start quiz', 'test my knowledge', 'practice questions'
    ], [
      'Perfect! Let\'s start a quiz for you.',
      'Great! I\'ll prepare some questions.'
    ]);

    // Train if not already trained
    if (!classifier.isTrained()) {
      await classifier.train();
    }
  }

  return classifier;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const classifier = await getClassifier();
    const result = await classifier.predict(message);

    return NextResponse.json({
      intent: result.intent,
      confidence: result.score,
      response: result.response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Intent classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify intent' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const classifier = await getClassifier();
    const intents = classifier.getIntents();

    return NextResponse.json({
      status: 'ready',
      intentsCount: intents.length,
      intents: intents.map(intent => ({
        name: intent.intent,
        utterancesCount: intent.utterances.length,
        responsesCount: intent.responses?.length || 0
      }))
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get classifier status' },
      { status: 500 }
    );
  }
}