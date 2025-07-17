# Advanced GlobalLoader - Context-Aware State-Based Loading System

## 🚀 Revolutionary Features

The GlobalLoader has been **completely transformed** into an advanced, context-aware loading system that intelligently adapts to different scenarios across your application.

## ✨ Key Innovations

✅ **13 Context Types**: Specialized loading for different scenarios  
✅ **Intelligent Prioritization**: Smart queue management with context-based priorities  
✅ **Context-Specific Icons**: Visual indicators that match the operation  
✅ **Adaptive Animations**: Different effects for different contexts  
✅ **Auto-Timeout**: Configurable timeouts per context type  
✅ **Progress Tracking**: Real-time progress for uploads and processes  
✅ **Background Effects**: Contextual visual enhancements  
✅ **Retry Capability**: Smart retry logic for failed operations  
✅ **No Blocking Issues**: Fixed priority logic prevents loader conflicts  

## 🎯 Context Types & Smart Defaults

### Authentication (Priority: 100)
```tsx
const { startAuthLoading } = useGlobalLoader()
startAuthLoading("Logging in") // Shield icon, pulse animation, blocking
```

### File Operations (Priority: 90-20)
```tsx
// Upload with progress tracking
const uploadId = startUploadLoading("document.pdf")
setProgress(50, uploadId) // Progress ring with upload icon

// Download with directional animation  
startLoading({ context: "download", message: "Preparing file..." })
```

### Data Management (Priority: 80-70)
```tsx
// Delete with minimal theme
startLoading({ context: "delete", message: "Removing item..." })

// Save with dots animation, non-blocking
startLoading({ context: "save", retryable: true })
```

### Navigation (Priority: 60)
```tsx
// Route changes with shimmer effect
const { startRouteLoading } = useGlobalLoader()
startRouteLoading("/dashboard/analytics")
```

### AI & Processing (Priority: 50-40)
```tsx
// AI generation with extended timeout
startLoading({ 
  context: "generate", 
  timeout: 60000,
  message: "AI is creating your content..."
})

// Processing with progress capability
startLoading({ context: "process", variant: "progress" })
```

### Learning & Content (Priority: 30-25)
```tsx
// Quiz loading with learning context
startQuizLoading("Machine Learning Fundamentals")

// Course with educational theme
startLoading({ context: "course", message: "Setting up environment..." })
```

### API & Search (Priority: 15-5)
```tsx
// API calls, non-blocking
startApiLoading("/api/users", "POST")

// Search with minimal interference
startLoading({ context: "search", size: "xs" })
```

## 🔥 Advanced Usage Examples

### Intelligent Priority System
```tsx
// Multiple loaders - highest priority shows first
startLoading({ context: "auth", priority: 100 })      // Shows
startLoading({ context: "save", priority: 70 })       // Queued  
startLoading({ context: "api", priority: 15 })        // Queued

// When auth completes, save shows next, then api
```

### Progress Tracking with Context
```tsx
const uploadId = startUploadLoading("large-video.mp4")

// Real-time progress updates
for (let i = 0; i <= 100; i += 5) {
  setProgress(i, uploadId)
  await new Promise(resolve => setTimeout(resolve, 100))
}

// Automatic success state with upload icon
```

### Smart Error Handling with Retry
```tsx
startLoading({
  context: "api",
  message: "Syncing data...",
  retryable: true,
  timeout: 10000
})

// On timeout or error, retry button appears
// Context-specific error messages and recovery
```

### Async Wrapper with Auto-States
```tsx
const { withLoading } = useGlobalLoader()

const result = await withLoading(
  fetch('/api/complex-operation').then(res => res.json()),
  {
    context: "process",
    message: "Analyzing data...",
    onSuccess: (data) => toast.success("Analysis complete!"),
    onError: (error) => toast.error("Analysis failed")
  }
)
// Automatic loading → success/error → cleanup
```

## 🎨 Context-Specific Design

### Visual Adaptations
- **Upload**: Upward flowing gradient animation
- **Download**: Downward flowing gradient animation  
- **Generate**: Pulsing AI-style background effects
- **Auth**: Radial security-themed animations
- **Route**: Smooth shimmer transitions
- **Quiz/Course**: Educational book-themed icons

### Icon System
Each context gets its specialized icon:
- 🛡️ **Auth**: Shield (security)
- 📤 **Upload**: Upload arrow (direction)
- 📥 **Download**: Download arrow (direction)
- 💾 **Save**: Save icon (persistence)
- 🗑️ **Delete**: Trash (removal)
- ⚡ **Process**: Zap (energy)
- ✨ **Generate**: Sparkles (AI magic)
- 📚 **Quiz/Course**: Book (learning)
- 👤 **User**: User (profile)
- 🔍 **Search**: Search glass (discovery)

## 📊 Smart Priority Queue

### Priority Levels (Auto-assigned by context)
```tsx
auth: 100      // Critical security operations
upload: 90     // File operations that can't be interrupted  
delete: 80     // Destructive actions need attention
save: 70       // Important but non-critical
route: 60      // Navigation changes
generate: 50   // AI processing
process: 40    // Data processing
quiz: 30       // Learning activities
course: 25     // Educational content
download: 20   // Background downloads
api: 15        // Regular API calls
user: 10       // Profile operations
search: 5      // Low-priority searches
default: 0     // Fallback
```

### Queue Behavior
1. **Higher priority always shows first**
2. **Blocking loaders take precedence over non-blocking**
3. **Same priority = newest shows first**
4. **Auto-cleanup prevents queue buildup**

## 🔧 Migration from Basic System

### Before (Props-based, No Context)
```tsx
// ❌ OLD: Generic, no intelligence
<GlobalLoader text="Loading..." />
{isLoading && <LoadingSpinner />}
```

### After (Context-aware, Smart)
```tsx
// ✅ NEW: Intelligent, adaptive
const { startQuizLoading, startUploadLoading } = useGlobalLoader()

// Auto-configures based on context
startQuizLoading("Advanced React")           // Quiz-themed UI
startUploadLoading("presentation.pptx")     // Upload-themed UI with progress
```

## 🚀 Performance & UX Improvements

### Eliminated Blocking Issues
- **Fixed Priority Logic**: No more stuck loaders
- **Smart Queue Management**: Automatic cleanup and progression
- **Context Switching**: Smooth transitions between different loading states

### Enhanced Visual Feedback
- **Context-Specific Animations**: Each context has unique effects
- **Adaptive Sizing**: Auto-adjusts based on importance and context
- **Background Effects**: Contextual visual enhancements
- **Progressive Enhancement**: Better animations without breaking functionality

### Developer Experience
- **TypeScript-First**: Full autocomplete for all context types
- **Intelligent Defaults**: No configuration needed for common cases
- **Debug-Friendly**: Clear state inspection in devtools
- **Consistent API**: Same patterns across all contexts

## 📱 Usage in Components

### Quiz Components
```tsx
const { startQuizLoading } = useGlobalLoader()

useEffect(() => {
  if (isLoadingQuiz) {
    startQuizLoading("Machine Learning Quiz")  // Auto: accent theme, book icon, blocking
  }
}, [isLoadingQuiz])
```

### File Upload Components
```tsx
const handleFileUpload = async (file: File) => {
  const uploadId = startUploadLoading(file.name)
  
  // Simulate upload with progress
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    // Auto-success state
  } catch (error) {
    // Auto-error state
  }
}
```

### Route Components
```tsx
const { startRouteLoading } = useGlobalLoader()

const handleNavigation = (path: string) => {
  startRouteLoading(path)  // Auto: shimmer effect, blocking, 10s timeout
  router.push(path)
}
```

## 🔮 Advanced Features

### Timeout Management
```tsx
// Context-specific timeouts
startLoading({ context: "generate", timeout: 60000 })  // 1 min for AI
startLoading({ context: "api", timeout: 10000 })       // 10s for API
startLoading({ context: "route", timeout: 5000 })      // 5s for navigation
```

### Retry Logic
```tsx
startLoading({
  context: "save",
  retryable: true,  // Shows retry button on error
  message: "Saving important data..."
})

// User can retry failed operations
const { retry } = useGlobalLoader()
retry(failedLoaderId)
```

### Multiple Concurrent Loaders
```tsx
// All can run simultaneously, priority determines visibility
const saveId = startLoading({ context: "save", priority: 70 })
const apiId = startLoading({ context: "api", priority: 15 })
const searchId = startLoading({ context: "search", priority: 5 })

// Save shows first, then API, then search as each completes
```

## ✅ Production Ready

The advanced GlobalLoader system is **100% production ready** with:

- **Zero Breaking Changes**: All existing code continues to work
- **Smart Defaults**: Works great without any configuration
- **Progressive Enhancement**: Advanced features available when needed
- **Performance Optimized**: Efficient animations and state management
- **Accessibility Ready**: Proper ARIA labels and screen reader support
- **TypeScript Complete**: Full type safety and IntelliSense

The system transforms the user experience from basic loading states to intelligent, context-aware feedback that feels natural and professional across your entire application.