import React from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

interface DynamicBreadcrumbSchemaProps {
  items: BreadcrumbItem[];
  siteUrl?: string;
}

/**
 * Dynamic BreadcrumbList Schema component for SEO
 * Use this on pages with dynamic breadcrumbs
 */
export default function DynamicBreadcrumbSchema({ 
  items,
  siteUrl = 'https://courseai.io' 
}: DynamicBreadcrumbSchemaProps) {
  // Ensure items are properly formatted
  const breadcrumbItems = items.map(item => ({
    '@type': 'ListItem',
    position: item.position,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
