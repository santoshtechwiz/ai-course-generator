import React from 'react';

interface JsonLDProps {
  type: string;
  data?: Record<string, any>; // Make data optional
}

/**
 * JsonLD Component for adding structured data to pages
 *
 * This is the canonical implementation to use across the application
 */
export function JsonLD({ type, data = {} }: JsonLDProps) {
  // Create the schema based on the type and data
  const schema = {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Export named alias for backward compatibility
export { JsonLD as JsonLd };

// Default export for simpler imports
export default JsonLD;
