# AI Learning Platform

A comprehensive AI-powered learning platform built with Next.js, featuring interactive courses, quizzes, flashcards, and advanced AI capabilities.

## 🚀 Features

- **Interactive Courses**: AI-generated courses with video content and progress tracking
- **Multiple Quiz Types**: MCQ, blanks, open-ended, ordering, and code quizzes
- **Flashcard System**: Spaced repetition learning with AI-generated flashcards
- **AI Chat Assistant**: Context-aware chat for course assistance
- **Progress Tracking**: Detailed analytics and learning progress monitoring
- **Subscription Management**: Multi-tier subscription system with Stripe integration
- **Admin Dashboard**: Comprehensive admin tools for content management
- **Real-time Notifications**: Live updates and progress notifications
- **Referral System**: Built-in referral program with rewards
- **Multi-provider AI**: Support for OpenAI, Anthropic, and Google AI models

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Redis (optional, for enhanced caching)
- Stripe account (for payments)

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/santoshtechwiz/ai-course-generator.git
   cd ai-learning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Set up PostgreSQL with pgvector
   npm run dev:migrate
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/courseai` |
| `NEXTAUTH_URL` | NextAuth base URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | `your-secret-key-here` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-your-openai-key` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

### AI Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER_TYPE` | AI provider (openai/anthropic/google) | `openai` |
| `AI_MODEL_FREE` | Free tier model | `gpt-3.5-turbo-1106` |
| `AI_MODEL_BASIC` | Basic tier model | `gpt-3.5-turbo-1106` |
| `AI_MODEL_PREMIUM` | Premium tier model | `gpt-4-1106-preview` |
| `AI_MODEL_ENTERPRISE` | Enterprise tier model | `gpt-4-1106-preview` |
| `CHAT_SEMANTIC_SUMMARY` | Enable chat summaries (0/1) | `1` |
| `CHAT_SUMMARY_MODEL` | Chat summary model | `gpt-4o-mini` |
| `EMBEDDING_SIMILARITY_THRESHOLD` | Vector search threshold | `0.1` |
| `EMBEDDING_TOP_K` | Vector search results count | `12` |

### Optional AI Providers

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |

### Payment Configuration (Optional)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Monitoring & Security (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `LOGGING_ENDPOINT` | External logging service URL | - |
| `MONITORING_ENDPOINT` | External monitoring service URL | - |
| `METRICS_ENABLED` | Enable metrics collection | `true` |
| `TRACING_ENABLED` | Enable distributed tracing | `true` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `SECURITY_HEADERS_ENABLED` | Enable security headers | `true` |
| `CORS_ALLOWED_ORIGINS` | CORS origins (comma-separated) | - |

### Performance (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `CACHE_TTL` | Cache TTL in seconds | `300` |
| `CACHE_MAX_KEYS` | Maximum cache keys | `1000` |
| `QUERY_LOGGING_ENABLED` | Enable query logging | `false` |
| `SLOW_QUERY_THRESHOLD` | Slow query threshold (ms) | `1000` |

## 📖 Usage

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Check code quality
npm run quality

# Generate embeddings (for AI features)
npm run generate-embeddings
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start

# Full production deployment
npm run prod
```

### Database Management

```bash
# Run migrations in development
npm run dev:migrate

# Run migrations in production
npm run prod:migrate

# Check subscription consistency
npm run check-consistency

# Fix subscription consistency issues
npm run fix-consistency
```

## 🔌 API Documentation

The platform provides a comprehensive REST API. Here are the main endpoints:

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth authentication
- `GET /api/auth/check` - Check authentication status
- `POST /api/auth/refresh` - Refresh authentication token

### Courses
- `GET /api/courses` - List all courses
- `GET /api/course/[slug]` - Get course details
- `POST /api/course` - Create new course
- `PUT /api/course/[slug]` - Update course
- `DELETE /api/course/[slug]` - Delete course

### Quizzes
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/[type]/[slug]` - Get quiz details
- `POST /api/quizzes/[type]/create` - Create quiz
- `POST /api/quizzes/[type]/[slug]/submit` - Submit quiz answers

### Progress Tracking
- `GET /api/progress/[courseId]` - Get course progress
- `POST /api/progress/chapter` - Update chapter progress
- `GET /api/progress/sync` - Sync progress data

### AI Features
- `POST /api/chat` - AI chat endpoint
- `POST /api/intent-classify` - Classify user intent
- `POST /api/summary` - Generate content summaries
- `POST /api/recommendations` - Get personalized recommendations

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/courses` - Get user's courses
- `GET /api/user/stats` - Get user statistics

### Admin (Requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/data` - Get system statistics
- `POST /api/admin/add-credits` - Add credits to user
- `POST /api/admin/reset` - Reset user data

### Subscriptions & Billing
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/billing/history` - Get billing history

### Flashcards
- `GET /api/flashcards/due` - Get due flashcards
- `POST /api/flashcards/review` - Review flashcards
- `GET /api/flashcards/stats` - Get flashcard statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification

### Health & Monitoring
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - System metrics
- `GET /api/ping` - Simple ping endpoint

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Test AI providers
npm run test:providers

# Quality checks
npm run test:quality
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t ai-learning .

# Run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build the application
5. Start the production server

### Environment Setup

For production, ensure these environment variables are set:
- `NODE_ENV=production`
- `DATABASE_URL` pointing to production database
- All required API keys
- Proper `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write comprehensive tests
- Update documentation for API changes
- Ensure code quality checks pass
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## 🔄 Changelog

See [VERSION.txt](VERSION.txt) for version history and changes.