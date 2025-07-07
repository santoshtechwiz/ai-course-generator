# AI Provider Architecture

This module implements a flexible AI provider architecture that allows easy swapping between different LLM providers like OpenAI and Google AI.

## Structure

The architecture follows these principles:

1. **Interface-Based Design**: All providers implement a common interface
2. **Factory Pattern**: A factory creates the appropriate provider instance
3. **Configuration-Driven**: Provider selection is controlled via environment variables
4. **Default Provider**: A default provider is exported for easy use

## Key Components

### 1. Interfaces (`interfaces.ts`)

Defines the common interfaces all AI providers must implement:

- `AIProvider`: Main interface with methods for all quiz generation capabilities
- `AIMessage`: Represents messages exchanged with AI models
- `AIFunction`: Represents functions that can be called by AI models
- `ChatCompletionParams`: Parameters for generating a chat completion
- `ChatCompletionResult`: Result of a chat completion
- `QuizGenerationParams`: Parameters for quiz generation

### 2. Provider Implementations

- **OpenAIProvider** (`openai-provider.ts`): Implementation for OpenAI
- **GoogleAIProvider** (`google-ai-provider.ts`): Placeholder for Google AI implementation

### 3. Factory (`provider-factory.ts`)

- `AIProviderFactory`: Creates provider instances based on type
- `getAIProvider()`: Returns the configured default provider
- `defaultAIProvider`: The default provider instance for easy import

### 4. Configuration (`config.ts`)

- `getAIProviderConfig()`: Returns the configuration from environment variables

## Usage

### Basic Usage

```typescript
import { defaultAIProvider } from '@/lib/ai';

// Generate MCQ questions
const questions = await defaultAIProvider.generateMCQQuiz({
  title: 'JavaScript Fundamentals',
  amount: 5,
  difficulty: 'medium',
  userType: 'FREE'
});
```

### Advanced Usage

```typescript
import { AIProviderFactory } from '@/lib/ai';

// Create a specific provider
const googleProvider = AIProviderFactory.createProvider('google', 'your-api-key');

// Use the provider
const quiz = await googleProvider.generateOpenEndedQuiz({
  title: 'Machine Learning Basics',
  amount: 3,
  difficulty: 'hard',
  userType: 'PREMIUM'
});
```

## Environment Variables

Configure the AI provider using these environment variables:

- `AI_PROVIDER_TYPE`: The provider to use ('openai' or 'google')
- `AI_PROVIDER_API_KEY`: API key for the provider
- `AI_MODEL_FREE`: Model to use for FREE tier users
- `AI_MODEL_BASIC`: Model to use for BASIC tier users
- `AI_MODEL_PREMIUM`: Model to use for PREMIUM tier users
- `AI_MODEL_ULTIMATE`: Model to use for ULTIMATE tier users

## Extending

To add a new AI provider:

1. Create a new provider class that implements the `AIProvider` interface
2. Add the provider type to the `AIProviderType` type in `provider-factory.ts`
3. Add a case to the `createProvider` method in `AIProviderFactory`
