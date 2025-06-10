export interface QuizIdentifier {
  slug: string;
  id?: string | number;
  title?: string;
  type?: string;
}

export function normalizeQuizIdentifier(identifier: string | QuizIdentifier | any): QuizIdentifier {
  // If it's already a proper format, return it
  if (typeof identifier === 'object' && identifier !== null && typeof identifier.slug === 'string') {
    return {
      slug: identifier.slug,
      id: identifier.id || identifier.slug,
      title: identifier.title || undefined,
      type: identifier.type || undefined
    };
  }
  
  // If it's a string, assume it's the slug
  if (typeof identifier === 'string') {
    return { slug: identifier, id: identifier };
  }
  
  // Handle edge cases
  const fallbackSlug = 
    identifier?.id ? String(identifier.id) :
    identifier?.quizId ? String(identifier.quizId) :
    'unknown-quiz';
    
  return { 
    slug: fallbackSlug, 
    id: fallbackSlug
  };
}

// Helper to extract slug from various formats
export function extractQuizSlug(source: any): string {
  if (!source) return 'unknown-quiz';
  
  if (typeof source === 'string') {
    return source;
  }
  
  if (typeof source === 'object') {
    return source.slug || source.id || String(source) || 'unknown-quiz';
  }
  
  return String(source);
}
