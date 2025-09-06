# pgvector Setup Guide

Your AI learning platform currently works with standard PostgreSQL using JSON string storage for embeddings. This provides full functionality with good performance for most use cases.

## Current Status
- ✅ **Working**: Standard PostgreSQL with JSON embedding storage
- ✅ **Similarity Search**: In-memory cosine similarity calculation
- ✅ **Chat Integration**: Fully functional with context-aware responses

## Optional: Enable pgvector for Enhanced Performance

If you want to enable pgvector for faster similarity search on large datasets:

### 1. Install pgvector Extension

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-14-pgvector
# Or for PostgreSQL 15: postgresql-15-pgvector
```

**On macOS (with Homebrew):**
```bash
brew install pgvector
```

**On Windows:**
- Download pgvector from: https://github.com/pgvector/pgvector
- Follow the Windows installation guide

### 2. Enable Extension in Database

Connect to your PostgreSQL database and run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Update Schema (Optional)

If you want to use the native vector type:

1. Update `prisma/schema.prisma`:
```prisma
model Embedding {
  id        String                     @id
  content   String
  embedding Unsupported("vector(1536)")? // OpenAI embeddings are 1536 dimensions
  type      String
  metadata  Json                       @default("{}")
  createdAt DateTime                   @default(now())
  updatedAt DateTime                   @updatedAt

  @@index([type])
  @@index([createdAt])
}
```

2. Create migration:
```bash
npx prisma migrate dev --name enable-pgvector-native
```

### 4. Benefits of pgvector

- **Faster Similarity Search**: Native vector operations
- **Better Indexing**: Specialized vector indexes (IVFFlat, HNSW)
- **Scalability**: Better performance with large embedding datasets
- **Memory Efficiency**: Reduced memory usage for similarity calculations

### 5. Verification

The system will automatically detect pgvector availability and log:
- "pgvector extension is available - enhanced similarity search enabled"
- Or "pgvector extension not available - using standard similarity search"

## Current Performance

Without pgvector, the system:
- Stores embeddings as JSON strings
- Calculates similarity in-memory
- Works perfectly for small to medium datasets (<10K embeddings)
- Provides identical functionality and accuracy

## Migration Strategy

You can enable pgvector at any time without data loss:
1. The system automatically detects pgvector availability
2. New embeddings will use vector type if available
3. Existing JSON embeddings continue to work
4. Gradual migration happens automatically

No code changes required - the EmbeddingManager handles both modes seamlessly!
