/**
 * NLP-based Intent Classifier using node-nlp
 * A reusable intent classification module with training and persistence
 */

const { NlpManager } = require('node-nlp');
import * as fs from 'fs';
import * as path from 'path';

export interface IntentData {
  intent: string;
  utterances: string[];
  responses?: string[];
}

export interface PredictionResult {
  intent: string;
  score: number;
  response?: string;
}

export class NlpIntentClassifier {
  private manager: any;
  private modelPath: string;
  private intents: Map<string, IntentData> = new Map();

  constructor(modelPath: string = './models/nlp-model.nlp') {
    this.manager = new NlpManager({
      languages: ['en'],
      forceNER: true,
      nlu: { log: false },
      autoSave: false,
      autoLoad: false
    });

    this.modelPath = modelPath;

    // Ensure model directory exists
    const modelDir = path.dirname(modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
  }

  /**
   * Add an intent with training utterances and optional responses
   */
  addIntent(intentName: string, utterances: string[], responses?: string[]): void {
    // Store intent data for reference
    this.intents.set(intentName, {
      intent: intentName,
      utterances,
      responses
    });

    // Add utterances to the NLP manager
    utterances.forEach(utterance => {
      this.manager.addDocument('en', utterance, intentName);
    });

    // Add responses if provided
    if (responses && responses.length > 0) {
      responses.forEach(response => {
        this.manager.addAnswer('en', intentName, response);
      });
    }
  }

  /**
   * Train the NLP model
   */
  async train(): Promise<void> {
    console.log('[NlpIntentClassifier] Starting training...');
    await this.manager.train();
    console.log('[NlpIntentClassifier] Training completed');

    // Save the trained model
    await this.saveModel();
    console.log('[NlpIntentClassifier] Model saved to disk');
  }

  /**
   * Predict intent from text input
   */
  async predict(text: string): Promise<PredictionResult> {
    // Load model if it exists
    await this.loadModelIfExists();

    const result = await this.manager.process('en', text);

    // Apply confidence threshold or check for unknown classifications
    if (result.score < 0.6 || result.intent === 'None' || !result.intent) {
      return {
        intent: 'unknown',
        score: result.score || 0,
        response: 'I\'m not sure what you mean. Could you please rephrase your question?'
      };
    }

    // Get a random response if available
    const intentData = this.intents.get(result.intent);
    let response: string | undefined;

    if (intentData?.responses && intentData.responses.length > 0) {
      const randomIndex = Math.floor(Math.random() * intentData.responses.length);
      response = intentData.responses[randomIndex];
    }

    return {
      intent: result.intent,
      score: result.score,
      response
    };
  }

  /**
   * Save the trained model to disk
   */
  private async saveModel(): Promise<void> {
    await this.manager.save(this.modelPath);
  }

  /**
   * Load model from disk if it exists
   */
  private async loadModelIfExists(): Promise<void> {
    try {
      if (fs.existsSync(this.modelPath)) {
        await this.manager.load(this.modelPath);
      }
    } catch (error) {
      console.warn('[NlpIntentClassifier] Could not load existing model:', error);
    }
  }

  /**
   * Get all registered intents
   */
  getIntents(): IntentData[] {
    return Array.from(this.intents.values());
  }

  /**
   * Check if model is trained
   */
  isTrained(): boolean {
    return this.intents.size > 0;
  }
}