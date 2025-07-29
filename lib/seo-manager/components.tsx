// ...existing code...
import React from 'react';
import { 
  JsonLDProps, 
  SchemaProps, 
  BreadcrumbListProps, 
  FAQItem, 
  FAQProps, 
  CombinedSchemaProps,
  OrganizationProps,
  CourseSchemaProps,
  DefaultSEOProps
} from './types';
import { defaultSiteInfo, defaultFAQItems, defaultSocialProfiles } from './constants';
import { generateBreadcrumbItemsFromPath } from './utils';

/**
 * SEO Manager - React Components
 * 
 * This file contains React components for rendering SEO-related elements
 * including JSON-LD structured data.
 */

/**
 * JsonLD Component for adding structured data to pages
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

/**
 * WebSite Schema component for SEO
 * Implements search functionality with potentialAction
 */
export function WebsiteSchema({ 
  siteName = defaultSiteInfo.name,
  siteUrl = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl 
}: SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    description: 'AI-powered coding education platform with interactive courses, quizzes, and learning tools',
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 112,
        height: 112,
      },
    },
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
export function BreadcrumbListSchema({ 
  items,
  siteUrl = defaultSiteInfo.url 
}: BreadcrumbListProps) {
  // Default breadcrumbs if none provided
  const defaultItems = [
    {
      position: 1,
      name: 'Home',
      url: `${siteUrl}/`,
    },
    {
      position: 2,
      name: 'Courses',
      url: `${siteUrl}/courses`,
    },
    {
      position: 3,
      name: 'About',
      url: `${siteUrl}/about`,
    },
  ];

  const breadcrumbItems = items || defaultItems;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
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
  name = defaultSiteInfo.name,
  url = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl,
  description = 'AI-powered coding education platform with interactive courses, quizzes, and learning tools',
  foundingDate = '2023-01-01',
  sameAs = defaultSocialProfiles,
  email = 'support@courseai.io',
  telephone,
  address,
}: OrganizationProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: 112,
      height: 112,
    },
    description,
    foundingDate,
    ...(sameAs.length > 0 && { sameAs }),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email,
      ...(telephone && { telephone }),
      url: `${url}/contact`,
    },
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        ...address,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ Schema component for SEO
 */
export function FAQSchema({ items }: FAQProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Course Schema component for SEO
 * Use this on course pages
 */
export function CourseSchema({
  courseName,
  courseUrl,
  description,
  provider = 'CourseAI',
  providerUrl = 'https://courseai.io',
  imageUrl,
  dateCreated = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  authorName,
  authorUrl
}: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description: description,
    url: courseUrl,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: providerUrl
    },
    ...(imageUrl && { image: imageUrl }),
    dateCreated,
    dateModified,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
        ...(authorUrl && { url: authorUrl })
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Combined SEO Schema component that renders multiple schemas at once
 */
export function CombinedSEOSchema({
  website = true,
  breadcrumbs = true,
  organization = true,
  faq,
  siteInfo = defaultSiteInfo,
}: CombinedSchemaProps) {
  return (
    <>
      {website && <WebsiteSchema {...siteInfo} />}
      
      {breadcrumbs && (
        typeof breadcrumbs === 'boolean' 
          ? <BreadcrumbListSchema siteUrl={siteInfo.url} />
          : <BreadcrumbListSchema {...breadcrumbs} siteUrl={siteInfo.url} />
      )}
      
      {organization && (
        typeof organization === 'boolean'
          ? <OrganizationSchema {...siteInfo} />
          : <OrganizationSchema {...siteInfo} {...organization} />
      )}
      
      {faq && <FAQSchema {...faq} />}
    </>
  );
}

/**
 * Default SEO component for all pages
 * Includes WebSite, BreadcrumbList, and Organization schemas
 */
export function DefaultSEO({ currentPath = '/', includeFAQ = false, customFAQItems }: DefaultSEOProps) {
  const breadcrumbs = currentPath ? generateBreadcrumbItemsFromPath(currentPath) : undefined;
  
  return (
    <CombinedSEOSchema
      breadcrumbs={
        breadcrumbs ? { items: breadcrumbs } : true
      }
      organization={{
        sameAs: defaultSocialProfiles
      }}
      faq={
        includeFAQ ? {
          items: customFAQItems || defaultFAQItems
        } : undefined
      }
    />
  );
}
