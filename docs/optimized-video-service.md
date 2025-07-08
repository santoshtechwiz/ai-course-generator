# Optimized Video Processing Service

## Overview

The optimized video processing service addresses performance issues in the original implementation by implementing:

- **Request debouncing and deduplication** - Prevents multiple simultaneous requests for the same topic
- **Multi-level caching** - Reduces API calls through intelligent caching strategies  
- **Queue-based processing** - Controls concurrency and prevents system overload
- **Graceful fallback mechanisms** - Ensures service availability even when YouTube API fails
- **Comprehensive monitoring** - Tracks performance metrics and error rates
- **Timeout handling** - Prevents hanging requests with proper cancellation

## Key Features

### 1. Request Debouncing
```typescript
// Multiple rapid requests for the same topic are consolidated
await optimizedVideoService.processVideoForChapter(123, "JavaScript basics")
await optimizedVideoService.processVideoForChapter(124, "JavaScript basics") // Uses debounced processor
```

### 2. Smart Caching Strategy
- **Video ID Cache**: 24 hours TTL for found videos
- **Topic Search Cache**: 30 minutes TTL for search results  
- **Chapter Status Cache**: 10 minutes TTL for status queries
- **Fallback Content Cache**: 2 hours TTL for emergency content

### 3. Queue Management
- Concurrency limit of 2 simultaneous YouTube API calls
- Rate limiting: 10 requests per second maximum
- Request prioritization and fair scheduling

### 4. Fallback Mechanisms
1. **Related Topic Fallback**: Uses cached videos from similar topics
2. **Default Video Fallback**: Uses predefined educational videos
3. **Graceful Degradation**: Service remains functional even with API failures

## API Usage

### Process Video (Optimized)
```http
POST /api/video/optimized
Content-Type: application/json

{
  "chapterId": 123,
  "topic": "React hooks tutorial"
}
```

### Process Video (Quick Mode)
```http
POST /api/video/optimized/quick
Content-Type: application/json

{
  "chapterId": 123,
  "topic": "React hooks tutorial"
}
```

The quick mode provides an immediate response with cached or fallback content while continuing processing in the background, preventing frontend timeouts.

### Check Video Status
```http
GET /api/video/optimized/status/123
```

**Response:**
```json
{
  "success": true,
  "videoId": "abc123xyz",
  "videoStatus": "completed",
  "isReady": true,
  "failed": false,
  "fromOptimizedService": true,
  "timestamp": "2025-07-07T14:30:00.000Z"
}
```

### Get Service Metrics
```http
GET /api/video/optimized
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "metrics": {
    "totalRequests": 45,
    "cacheHits": 32,
    "cacheMisses": 13,
    "errors": 2,
    "timeouts": 1,
    "fallbacks": 1,
    "queueSize": 2,
    "queuePending": 0,
    "activeRequests": 1,
    "cacheHitRate": 0.71
  },
  "timestamp": "2025-07-07T14:30:00.000Z"
}
```

## Performance Improvements

### Before (Original Service)
- ❌ No request deduplication
- ❌ No caching strategy
- ❌ No timeout handling
- ❌ No fallback mechanisms
- ❌ No monitoring/observability
- ❌ Uncontrolled concurrency

### After (Optimized Service)
- ✅ Intelligent request debouncing
- ✅ Multi-level caching with TTL
- ✅ Robust timeout and cancellation
- ✅ Graceful fallback strategies
- ✅ Comprehensive metrics and logging
- ✅ Queue-based concurrency control

## Migration Guide

### 1. Update Your Frontend Code
```typescript
// Old approach
const response = await fetch('/api/video', {
  method: 'POST',
  body: JSON.stringify({ chapterId: 123 })
})

// New optimized approach
const response = await fetch('/api/video/optimized', {
  method: 'POST', 
  body: JSON.stringify({ 
    chapterId: 123,
    topic: "React hooks tutorial" // Optional but recommended
  })
})
```

### 2. Handle Enhanced Response Data
```typescript
const result = await response.json()

if (result.success) {
  console.log('Video ID:', result.videoId)
  console.log('From cache:', result.fromCache)
  console.log('Processing time:', result.processingTime, 'ms')
  console.log('Cache hit rate:', result.metrics.cacheHitRate)
}
```

### 3. Monitor Service Health
```typescript
// Check service health periodically
const healthCheck = await fetch('/api/video/optimized')
const health = await healthCheck.json()

if (health.metrics.cacheHitRate < 0.5) {
  console.warn('Low cache hit rate detected')
}

if (health.metrics.errors / health.metrics.totalRequests > 0.1) {
  console.error('High error rate detected')
}
```

## Migration Guide for Frontend Teams

To solve frontend timeout issues and improve user experience, follow these guidelines:

### 1. Replace Direct API Calls with Optimized Service

**Before:**
```typescript
// ❌ Problematic approach - may cause timeouts
const loadVideo = async (chapterId) => {
  const response = await fetch(`/api/video?chapterId=${chapterId}`)
  const data = await response.json()
  setVideoId(data.videoId)
}
```

**After:**
```typescript
// ✅ Recommended approach - uses optimized quick mode
const loadVideo = async (chapterId) => {
  try {
    // Use quick mode API for immediate response
    const response = await fetch('/api/video/optimized/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, topic: 'your topic here' })
    })
    
    const data = await response.json()
    
    if (data.success) {
      setVideoId(data.videoId)
      
      // Optionally poll for better content if using fallback
      if (!data.fromCache) {
        startPollingForBetterVideo(chapterId)
      }
    }
  } catch (error) {
    console.error('Video loading error:', error)
    setError('Failed to load video content')
  }
}
```

### 2. Use Provided Components

For the easiest integration, use the pre-built components:

```tsx
import { OptimizedVideoPlayer } from '@/components/features/OptimizedVideoPlayer'

// Simple usage with a single component
<OptimizedVideoPlayer chapterId={123} topic="React tutorial" />
```

### 3. Decoupling Video Loading from Subscription Actions

If you're experiencing timeout issues in the subscription slice, make sure to:

1. Use the demo component `SubscriptionVideoDemo` as a reference
2. Load videos independently from subscription API calls
3. Use the quick mode API endpoint for all initial video loading
4. Implement proper loading states and fallback UI

For a complete example integration, see `components/demo/SubscriptionVideoDemo.tsx`

## Addressing Frontend Timeouts

The optimized video service addresses frontend timeout issues through:

### 1. Quick Response Mode

The quick mode API endpoint returns immediately with either:
- Cached video content (if available)
- Fallback video content (if no cache)

while continuing to process the real video request in the background.

### 2. Non-Blocking Architecture

- **Frontend Components**: Never block UI thread while waiting for video content
- **Background Processing**: Real video processing happens asynchronously
- **Status Polling**: UI updates automatically when better content is available

### 3. Timeout Prevention

To prevent subscription slice timeouts:
- Use the quick mode API for initial video loading
- Implement UI components that work with fallback content
- Apply the pattern shown in OptimizedVideoLoader to handle graceful fallback

### Example Integration with Redux

```tsx
// In your Redux thunk
export const loadChapterVideo = createAsyncThunk(
  'chapter/loadVideo',
  async ({ chapterId, topic }, { rejectWithValue }) => {
    try {
      // Use the quick mode for immediate response
      const response = await axios.post('/api/video/optimized/quick', {
        chapterId,
        topic
      })
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to load video')
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Unknown error')
    }
  }
)
```

## Configuration

The service can be configured via environment variables:

```env
# Cache settings
CACHE_VIDEO_TTL=86400        # 24 hours
CACHE_TOPIC_TTL=1800         # 30 minutes  
CACHE_STATUS_TTL=600         # 10 minutes

# Processing settings
QUEUE_CONCURRENCY=2          # Max simultaneous requests
REQUEST_TIMEOUT=30000        # 30 seconds
MAX_RETRIES=3               # Retry attempts
DEBOUNCE_MS=500             # Debounce delay

# Monitoring
LOG_LEVEL=info              # Logging level
METRICS_INTERVAL=300000     # 5 minutes
```

## Dependencies

The optimized service uses these battle-tested libraries:

```json
{
  "p-queue": "^8.0.1",        // Queue management
  "p-retry": "^6.2.0",        // Retry logic  
  "p-timeout": "^6.1.2",      // Timeout handling
  "node-cache": "^5.1.2"      // In-memory caching
}
```

## Error Handling

The service implements comprehensive error handling:

1. **Validation Errors**: Invalid request parameters
2. **Timeout Errors**: Requests exceeding time limits
3. **API Errors**: YouTube API failures or rate limits
4. **Network Errors**: Connection issues
5. **Fallback Errors**: When all fallback mechanisms fail

Each error type is logged with context and handled gracefully to maintain service availability.

## Frontend Integration

### Using the OptimizedVideoLoader Hook

```tsx
import { OptimizedVideoLoader } from '@/components/features/OptimizedVideoLoader'

function MyComponent() {
  const { videoId, loading, error, processingStatus } = OptimizedVideoLoader({
    chapterId: 123,
    topic: 'React hooks tutorial',
    onVideoReady: (videoId) => console.log('Video ready:', videoId),
    onError: (error) => console.error('Error loading video:', error)
  })
  
  return (
    <div>
      {videoId ? (
        <iframe src={`https://www.youtube.com/embed/${videoId}`} />
      ) : (
        <div>Loading video...</div>
      )}
    </div>
  )
}
```

### Using the OptimizedVideoPlayer Component

```tsx
import { OptimizedVideoPlayer } from '@/components/features/OptimizedVideoPlayer'

function MyPage() {
  return (
    <div className="container">
      <h1>React Hooks Tutorial</h1>
      
      <OptimizedVideoPlayer 
        chapterId={123}
        topic="React hooks tutorial"
        title="Learn React Hooks"
      />
    </div>
  )
}
```

The OptimizedVideoPlayer component uses the quick mode API to prevent UI blocking and timeouts, providing a smooth user experience even when the backend is processing requests.
