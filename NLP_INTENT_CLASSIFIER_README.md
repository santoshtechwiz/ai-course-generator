# NLP Intent Classifier Implementation

This implementation provides a reusable Intent Classification module using the `node-nlp` package for Node.js applications.

## 🚀 Features

- **NlpManager Integration**: Uses `node-nlp`'s NlpManager for robust intent classification
- **Persistent Models**: Automatically saves and loads trained models to/from disk
- **Confidence Scoring**: Implements 0.6 confidence threshold with fallback to "unknown" intent
- **Response Management**: Supports predefined responses for each intent
- **TypeScript Support**: Full TypeScript implementation with proper types
- **Easy Configuration**: Centralized intent configuration

## 📁 Folder Structure

```
app/
├── services/
│   └── chat/
│       ├── NlpIntentClassifier.ts          # Main classifier class
│       └── NlpIntentClassifier-example.ts  # Usage examples
├── api/
│   └── intent-classify/
│       └── route.ts                        # Next.js API route example
└── config/
    └── intent-config.ts                    # Intent configuration

__tests__/
└── nlp-intent-classifier.test.ts          # Test suite

models/                                    # Auto-created directory for saved models
└── *.nlp                                 # Trained model files
```

## 🛠️ Installation

```bash
npm install node-nlp
```

## 📖 Usage

### Basic Usage

```typescript
import { NlpIntentClassifier } from './services/chat/NlpIntentClassifier';

const classifier = new NlpIntentClassifier('./models/my-model.nlp');

// Add intents
classifier.addIntent('greeting', [
  'hello', 'hi', 'hey', 'greetings'
], [
  'Hello! How can I help you?',
  'Hi there! What can I do for you?'
]);

// Train the model
await classifier.train();

// Classify text
const result = await classifier.predict('hello there');
console.log(result.intent); // 'greeting'
console.log(result.score);  // 0.95
console.log(result.response); // Random response from array
```

### API Route Integration (Next.js)

```typescript
// POST /api/intent-classify
const response = await fetch('/api/intent-classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'I want to learn Python' })
});

const result = await response.json();
// {
//   intent: 'course.search',
//   confidence: 0.89,
//   response: 'I can help you find courses on that topic!'
// }
```

## 🔧 Configuration

Use the centralized config for managing intents:

```typescript
import { DEFAULT_INTENTS } from '@/config/intent-config';

const classifier = new NlpIntentClassifier();

// Load all default intents
Object.entries(DEFAULT_INTENTS).forEach(([intent, config]) => {
  classifier.addIntent(intent, config.utterances, config.responses);
});
```

## 🧪 Testing

Run the test suite:

```bash
npx tsx __tests__/nlp-intent-classifier.test.ts
```

## 🔮 Future Extensions

### 1. Multilingual Support
```typescript
const classifier = new NlpIntentClassifier('./models/multilingual.nlp');

// Add multiple languages
classifier.addIntent('greeting', [
  'hello', 'hi'  // English
], ['Hello!'], 'en');

classifier.addIntent('greeting', [
  'hola', 'buenos días'  // Spanish
], ['¡Hola!'], 'es');
```

### 2. Context Memory
```typescript
interface Context {
  previousIntent: string;
  userPreferences: string[];
  conversationHistory: string[];
}

class ContextualClassifier extends NlpIntentClassifier {
  private context: Context;

  async predictWithContext(text: string, context: Context): Promise<PredictionResult> {
    // Use context to improve predictions
    const result = await this.predict(text);

    // Adjust based on conversation history
    if (context.previousIntent === 'course.search' && result.intent === 'unknown') {
      // Maybe they want course-related help
    }

    return result;
  }
}
```

### 3. LangChain Integration
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { LLMChain } from 'langchain/chains';

class LangChainIntentClassifier extends NlpIntentClassifier {
  private llm = new ChatOpenAI({ temperature: 0 });

  async predictWithLLM(text: string): Promise<PredictionResult> {
    // First try NLP classification
    const nlpResult = await this.predict(text);

    // If low confidence, use LLM for refinement
    if (nlpResult.score < 0.7) {
      const chain = new LLMChain({
        llm: this.llm,
        prompt: 'Classify this intent: {text}'
      });

      const llmResult = await chain.call({ text });
      // Combine results...
    }

    return nlpResult;
  }
}
```

### 4. Dynamic Intent Loading
```typescript
class DynamicIntentClassifier extends NlpIntentClassifier {
  async loadIntentsFromDatabase(): Promise<void> {
    // Load intents from database/API
    const intents = await fetch('/api/intents').then(r => r.json());

    intents.forEach(intent => {
      this.addIntent(intent.name, intent.utterances, intent.responses);
    });

    await this.train();
  }
}
```

### 5. Performance Optimization
```typescript
class OptimizedClassifier extends NlpIntentClassifier {
  private cache = new Map<string, PredictionResult>();

  async predict(text: string): Promise<PredictionResult> {
    const cacheKey = text.toLowerCase().trim();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = await super.predict(text);
    this.cache.set(cacheKey, result);

    return result;
  }
}
```

## 📊 Performance Considerations

- **Model Size**: Keep utterances concise but comprehensive
- **Training Time**: Initial training may take time; models are cached
- **Memory Usage**: Large models may require optimization
- **Accuracy**: More diverse utterances improve accuracy

## 🔒 Security Notes

- Validate input text length and content
- Implement rate limiting for API endpoints
- Store model files securely
- Consider input sanitization

## 🤝 Contributing

1. Add new intents to `config/intent-config.ts`
2. Update tests in `__tests__/nlp-intent-classifier.test.ts`
3. Ensure TypeScript compilation passes
4. Test with various input scenarios