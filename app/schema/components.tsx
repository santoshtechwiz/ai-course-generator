import React from 'react';

interface JsonLDProps {
  type: string;
  data: Record<string, any>;
}

/**
 * JsonLD component for adding structured data to pages
 * Helps with SEO by providing search engines with structured data
 */
export const JsonLD: React.FC<JsonLDProps> = ({ type, data }) => {
  // Create the full schema object with @context and @type
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};
