# Unified Storage System

A comprehensive storage solution that consolidates all localStorage, sessionStorage, encryption, and persistence needs across the AI Learning Platform.

## 🚀 Features

- **Unified API**: Single interface for both localStorage and sessionStorage
- **Encryption**: Built-in AES encryption for sensitive data
- **Type Safety**: Full TypeScript support with generic types
- **SSR Compatible**: Safe server-side rendering support
- **Auto Migration**: Automatic migration from legacy storage patterns
- **Error Handling**: Robust error handling and recovery
- **Memory Management**: Automatic cleanup and size limits
- **Cross-tab Sync**: Optional synchronization across browser tabs
- **Performance**: Optimized for large applications

## 📦 Installation

The storage system is already integrated into the project. Simply import what you need:

```typescript
import { storage, useStorage, migratedStorage } from '@/lib/storage'
```

## 🎯 Basic Usage

### Core Storage Operations

```typescript
import { storage } from '@/lib/storage'

// Basic operations
storage.setItem('user_preference', { theme: 'dark' })
const preference = storage.getItem('user_preference')
storage.removeItem('user_preference')

// With options
storage.setItem('sensitive_data', userData, {
  encrypt: true,        // Encrypt the data
  storage: 'localStorage', // or 'sessionStorage'
  ttl: 60 * 60 * 1000  // Time-to-live in milliseconds
})

// Temporary storage (sessionStorage)
storage.setTemporary('temp_data', { session: 'info' })

// Secure storage (encrypted localStorage)
storage.setSecureItem('auth_token', token)
```

### React Hooks

```typescript
import { usePersistentState, usePreference } from '@/lib/storage'

function MyComponent() {
  // Persistent state with localStorage
  const [settings, setSettings] = usePersistentState('app_settings', {
    theme: 'light',
    notifications: true
  })

  // User preferences (simplified)
  const [theme, setTheme] = usePreference('theme', 'light')

  // Secure state (encrypted)
  const [tokens, setTokens] = useSecureState('auth_tokens', null)

  return <div>...</div>
}
```

### Migration Helper

```typescript
import { migratedStorage } from '@/lib/storage'

// Automatically handles migration from old patterns
const value = migratedStorage.getItem('old_key') // Checks new and old locations
migratedStorage.setPreference('theme', 'dark')   // Stores with proper prefix
migratedStorage.setQuizData('quiz_123', data)    // Stores securely
```

## 🔧 Advanced Usage

### Custom Serialization

```typescript
// Custom serialization for complex objects
storage.setItem('complex_data', myObject, {
  serialize: (obj) => JSON.stringify(obj, null, 2),
  deserialize: (str) => JSON.parse(str)
})
```

### Storage with TTL

```typescript
// Auto-expiring data
storage.setItem('temporary_cache', data, {
  ttl: 30 * 60 * 1000 // Expires in 30 minutes
})
```

### Cross-tab Synchronization

```typescript
// Sync state across browser tabs
const [sharedState, setSharedState] = usePersistentState('shared_data', initialValue, {
  syncAcrossTabs: true
})
```

## 🏗️ Architecture

### Storage Types

1. **localStorage**: Persistent storage that survives browser sessions
2. **sessionStorage**: Temporary storage that expires with the tab
3. **Encrypted**: AES-encrypted localStorage for sensitive data
4. **Preferences**: Special handling for user preferences
5. **Quiz Data**: Specialized secure storage for quiz information

### Migration System

The system automatically migrates data from legacy storage patterns:

- `localStorage.getItem('authToken')` → `storage.getSecureItem('auth_token')`
- `localStorage.getItem('theme')` → `storage.getPreference('theme')`
- Old quiz keys → Encrypted quiz storage

### Key Mapping

| Old Key | New Pattern | Storage Type |
|---------|-------------|--------------|
| `authToken` | `auth_token` | Secure |
| `theme` | `pref_theme` | Preference |
| `hasSeenTooltip` | `pref_seen_tooltip` | Preference |
| `quiz_*` | `quiz_*` | Secure |
| `pendingQuizResults` | `quiz_pending_results` | Secure |

## 🔐 Security Features

- **AES Encryption**: Sensitive data is encrypted using AES-256
- **Data Sanitization**: Automatic removal of sensitive fields
- **Quiz Protection**: Answer data is stripped to prevent cheating
- **Token Security**: Auth tokens are automatically encrypted

## 📊 Monitoring & Cleanup

### Storage Statistics

```typescript
import { useStorageStats } from '@/lib/storage'

function StorageMonitor() {
  const stats = useStorageStats()
  
  return (
    <div>
      <p>localStorage: {stats.localStorage} items</p>
      <p>sessionStorage: {stats.sessionStorage} items</p>
    </div>
  )
}
```

### Cleanup Utilities

```typescript
import { performStorageCleanup, generateStorageReport } from '@/lib/storage'

// Run cleanup
const results = performStorageCleanup()
console.log(`Migrated: ${results.migrated}, Cleaned: ${results.cleaned}`)

// Generate report
const report = generateStorageReport()
console.log('Storage Report:', report)
```

## 🔄 Migration Guide

### From localStorage

```typescript
// Old way
localStorage.setItem('key', JSON.stringify(value))
const data = JSON.parse(localStorage.getItem('key') || '{}')

// New way
storage.setItem('key', value)
const data = storage.getItem('key', {})
```

### From Custom Hooks

```typescript
// Old way
const [state, setState] = useLocalStorage('key', defaultValue)

// New way
const [state, setState] = usePersistentState('key', defaultValue)
```

### From Manual Encryption

```typescript
// Old way
const encrypted = AES.encrypt(JSON.stringify(data), secret)
localStorage.setItem('key', encrypted.toString())

// New way
storage.setSecureItem('key', data)
```

## ⚙️ Configuration

### Environment Variables

```env
# Storage encryption secret (required)
NEXT_PUBLIC_STORAGE_SECRET=your-secret-key-here
```

### Storage Limits

- **Max Item Size**: 1MB per item
- **Max Total Size**: 5MB total storage
- **Cleanup Interval**: 5 minutes
- **Error Log Limit**: 10 entries

## 🐛 Troubleshooting

### Common Issues

1. **Data Not Persisting**
   - Check if storage is available (private browsing)
   - Verify the key naming conventions
   - Check storage quota limits

2. **Migration Issues**
   - Run `performStorageCleanup()` manually
   - Check console for migration errors
   - Validate with `validateStorageMigration()`

3. **Performance Issues**
   - Enable compression for large data
   - Use TTL for temporary data
   - Clean up expired entries

### Debug Tools

```typescript
// Enable debug mode
if (process.env.NODE_ENV === 'development') {
  window.storageDebug = {
    cleanup: performStorageCleanup,
    validate: validateStorageMigration,
    report: generateStorageReport
  }
}
```

## 📈 Performance Tips

1. **Use TTL for temporary data** to prevent storage bloat
2. **Prefer sessionStorage** for temporary UI state
3. **Encrypt only sensitive data** (encryption has overhead)
4. **Use compression** for large objects
5. **Batch operations** when possible

## 🚦 API Reference

### Core Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `setItem` | Store data | `key, value, options?` |
| `getItem` | Retrieve data | `key, options?` |
| `removeItem` | Remove data | `key, options?` |
| `setSecureItem` | Store encrypted | `key, value, options?` |
| `setTemporary` | Store in sessionStorage | `key, value, options?` |
| `setPreference` | Store user preference | `key, value` |

### Hook Methods

| Hook | Description | Returns |
|------|-------------|---------|
| `usePersistentState` | Persistent state | `[state, setter, loading, error]` |
| `usePreference` | User preference | `[value, setter, loading, error]` |
| `useSecureState` | Encrypted state | `[state, setter, loading, error]` |
| `useStorageStats` | Storage statistics | `{ localStorage, sessionStorage, total }` |

## 📝 Best Practices

1. **Use appropriate storage types** for your data
2. **Implement proper error handling**
3. **Set TTL for temporary data**
4. **Use type safety** with TypeScript
5. **Test migration paths** thoroughly
6. **Monitor storage usage** in production
7. **Clean up expired data** regularly

## 🔮 Future Enhancements

- [ ] IndexedDB support for large data
- [ ] Compression for large objects
- [ ] Storage quotas and warnings
- [ ] Cloud synchronization
- [ ] Storage analytics dashboard
- [ ] Performance monitoring
- [ ] A/B testing integration

---

For questions or issues, please refer to the project documentation or create an issue in the repository.
