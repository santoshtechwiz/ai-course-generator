import React from 'react';
import { JsonLdType } from '../schema-types';

interface SchemaProps {
  siteUrl?: string;
  siteName?: string;
  logoUrl?: string;
  socialProfiles?: string[];
}

/**
 * WebSite Schema component for SEO
 * Implements search functionality with potentialAction
 */
export function WebsiteSchema({ 
  siteUrl = 'https://courseai.io',
  siteName = 'CourseAI'
}: SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList Schema component for SEO
 */
export function BreadcrumbListSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://courseai.io'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses',
        item: 'https://courseai.io/courses'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'About',
        item: 'https://courseai.io/about'
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Organization Schema component for SEO
 */
export function OrganizationSchema({ 
  siteUrl = 'https://courseai.io',
  siteName = 'CourseAI',
  logoUrl = 'https://courseai.io/logo.png',
  socialProfiles = []
}: SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: logoUrl,
    ...(socialProfiles.length > 0 && { sameAs: socialProfiles })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Combined Schema component that renders all three schemas at once
 */
export function CombinedSEOSchema(props: SchemaProps) {
  return (
    <>
      <WebsiteSchema {...props} />
      <BreadcrumbListSchema />
      <OrganizationSchema {...props} />
    </>
  );
}
