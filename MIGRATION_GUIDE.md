# AI Services Architecture Migration Guide

## Overview

This guide outlines the migration from the legacy AI services architecture to the new unified context-based system implemented in Phase 2.

## Key Changes

### Before (Legacy Architecture)
```typescript
// Old way - scattered context
const service = await AIServiceFactory.createFromSession(userId, plan, authenticated, credits)
const result = await service.generateMCQ({ topic, count })

// Credit deduction happened separately in API routes
await creditService.deductCredits(userId, 1, 'QUIZ_CREATION')
```

### After (New Architecture)
```typescript
// New way - unified context
const context = await contextProvider.createContext(session, request)
const service = AIServiceFactoryV2.createService(context)
const result = await service.generateMultipleChoiceQuiz({ topic, count })

// Credits automatically deducted within service execution
```

## Migration Steps

### Phase 2A: Service Layer Migration

#### 1. Update Import Statements
```typescript
// Before
import { AIServiceFactory } from '@/lib/ai/services/AIServiceFactory'

// After
import { AIServiceFactoryV2, AIContextProvider } from '@/lib/ai/infrastructure'
```

#### 2. Update Service Instantiation
```typescript
// Before
const service = await AIServiceFactory.createFromSession(userId, plan, authenticated, credits)

// After
const contextProvider = new AIContextProvider()
const context = await contextProvider.createContext(session, request)
const service = AIServiceFactoryV2.createService(context)
```

#### 3. Update Method Calls
```typescript
// Before
const result = await service.generateMultipleChoiceQuiz(params)

// After
const result = await service.generateMultipleChoiceQuiz(params)
// Credits are automatically deducted, no separate API call needed
```

### Phase 2B: API Route Updates

#### 1. Update Route Handlers
```typescript
// Before
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  const userId = session?.user?.id

  // Manual credit checking and deduction
  const creditResult = await creditService.executeCreditsOperation(userId, 1, 'QUIZ_CREATION')
  if (!creditResult.success) {
    return NextResponse.json({ error: creditResult.error }, { status: 403 })
  }

  const service = await AIServiceFactory.createFromSession(userId, plan, true, credits)
  const result = await service.generateMCQ(params)
}

// After
export async function POST(req: NextRequest) {
  const session = await getAuthSession()

  // Create unified context
  const contextProvider = new AIContextProvider()
  const context = await contextProvider.createContext(session, req)

  // Create service with full context
  const service = AIServiceFactoryV2.createService(context)
  const result = await service.generateMultipleChoiceQuiz(params)

  // Credits automatically handled within service
}
```

#### 2. Remove Manual Credit Logic
Remove all manual credit deduction calls from API routes:
- `creditService.deductCredits()`
- `creditService.executeCreditsOperation()`
- Manual credit balance checks

### Phase 2C: Quiz Service Updates

#### 1. Update Base Quiz Services
```typescript
// Before
export class McqQuizService extends BaseQuizService {
  async generateQuiz(params) {
    const service = await AIServiceFactory.createFromSession(userId, plan, authenticated, credits)
    return await service.generateMCQ(params)
  }
}

// After
export class McqQuizService extends BaseQuizService {
  async generateQuiz(params) {
    const contextProvider = new AIContextProvider()
    const context = await contextProvider.createContext(session, request)
    const service = AIServiceFactoryV2.createService(context)
    return await service.generateMultipleChoiceQuiz(params)
  }
}
```

#### 2. Update Course AI Service
```typescript
// Before
export async function generateMCQ(topic, count, difficulty, userId, plan, credits) {
  const context = { userId, subscriptionPlan: plan, isAuthenticated: !!userId, credits }
  const service = AIServiceFactory.createService(context)
  return await service.generateMultipleChoiceQuiz({ topic, count, difficulty })
}

// After
export async function generateMCQ(topic, count, difficulty, userId, plan, credits) {
  // This function becomes a simple wrapper for backward compatibility
  // Actual logic moves to API routes using new architecture
  throw new Error('Use AIServiceFactoryV2 with AIRequestContext instead')
}
```

## Backward Compatibility

### Legacy API Endpoints
- Keep existing API endpoints working during transition
- Use feature flags to route between old and new implementations
- Gradually migrate endpoints to new architecture

### Legacy Service Methods
- Maintain old service methods with deprecation warnings
- Route legacy calls through compatibility layer
- Remove deprecated methods after full migration

## Testing Strategy

### Unit Tests
```typescript
describe('AIServiceV2', () => {
  it('should deduct credits automatically', async () => {
    const context = createMockContext({ credits: 10 })
    const service = AIServiceFactoryV2.createService(context)

    await service.generateMultipleChoiceQuiz(params)

    expect(context.subscription.credits.available).toBe(9) // 1 credit deducted
  })
})
```

### Integration Tests
```typescript
describe('AI API Migration', () => {
  it('should work with new context architecture', async () => {
    const response = await request(app)
      .post('/api/quizzes/mcq/create')
      .set('Authorization', 'Bearer token')
      .send({ topic: 'Test', count: 5 })

    expect(response.status).toBe(200)
    expect(response.body.creditsRemaining).toBeDefined()
  })
})
```

### Migration Tests
```typescript
describe('Backward Compatibility', () => {
  it('should maintain legacy API compatibility', async () => {
    // Test that old endpoints still work during migration
    const oldResponse = await request(app).post('/api/legacy/quiz').send(data)
    const newResponse = await request(app).post('/api/quizzes/mcq/create').send(data)

    expect(oldResponse.body).toEqual(newResponse.body)
  })
})
```

## Rollback Plan

### Feature Flags
- Use feature flags to enable/disable new architecture
- Roll back by disabling flags if issues arise
- Monitor error rates and performance metrics

### Database Changes
- New audit tables are additive (no destructive changes)
- Can disable audit logging if needed
- Credit operations remain compatible

### Service Registry
- Maintain service registry to route between old/new implementations
- Gradually increase traffic to new services
- Monitor for regressions

## Performance Considerations

### New Architecture Benefits
- **Reduced API Calls**: Credit validation/deduction in single transaction
- **Better Caching**: Context caching reduces redundant operations
- **Optimized Providers**: Smart provider selection based on context
- **Batch Operations**: Usage tracking with batch writes

### Monitoring Metrics
- Response time improvements
- Error rate reductions
- Credit operation success rates
- Cache hit rates

## Security Enhancements

### New Security Features
- **Risk-based Auditing**: Configurable audit levels
- **Token Rotation**: Automatic key rotation and validation
- **Context Validation**: Comprehensive input validation
- **Access Control**: Centralized permission checking

### Compliance Improvements
- **Audit Trails**: Complete operation logging
- **PII Handling**: Secure context data management
- **Access Logging**: Who, what, when, where tracking

## Success Criteria

### Functional Requirements
- ✅ All existing AI features work with new architecture
- ✅ Credit deduction happens automatically
- ✅ No manual credit management in API routes
- ✅ Comprehensive audit logging
- ✅ Backward compatibility maintained

### Performance Requirements
- ✅ Response times within 10% of current system
- ✅ Error rates below 1%
- ✅ Credit operation success rate > 99.9%
- ✅ Audit logging doesn't impact performance

### Security Requirements
- ✅ All security assessments pass
- ✅ No PII leakage in logs
- ✅ Token management secure
- ✅ Access controls enforced

## Timeline

- **Week 1**: Complete service layer migration
- **Week 2**: Update API routes and test integration
- **Week 3**: Full system testing and performance validation
- **Week 4**: Production deployment with monitoring
- **Week 5**: Legacy cleanup and optimization

## Risk Mitigation

### High-Risk Areas
1. **Credit Operations**: Atomic transactions prevent inconsistencies
2. **Context Creation**: Comprehensive validation prevents invalid contexts
3. **Provider Selection**: Fallback mechanisms for provider failures
4. **Audit Logging**: Asynchronous logging prevents blocking operations

### Monitoring & Alerts
- Set up alerts for credit operation failures
- Monitor context creation success rates
- Track AI operation response times
- Alert on unusual usage patterns

This migration modernizes the AI services architecture while maintaining stability and adding significant improvements in security, performance, and maintainability.