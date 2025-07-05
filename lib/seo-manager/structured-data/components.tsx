/**
 * React components for schema.org structured data
 */
import React from 'react';
import {
  SiteInfo,
  BreadcrumbItem,
  FAQItem,
  OrganizationProps,
  BreadcrumbListProps,
  FAQProps,
  CombinedSchemaProps,
  CourseData,
  QuizData
} from './types';
import { defaultSiteInfo, defaultFAQItems, BASE_URL } from '../config';
import * as SchemaGenerators from './generators';

/**
 * JsonLD Component for adding structured data to pages
 *
 * This is the canonical implementation to use across the application
 */
export function JsonLD({ type, data = {} }: { type: string; data?: Record<string, any> }) {
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
 * WebSite schema with search box functionality
 */
export function WebsiteSchema({ 
  name = defaultSiteInfo.name,
  url = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl 
}: SiteInfo) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    url,
    name,
    description: 'AI-powered coding education platform with interactive courses, quizzes, and learning tools',
    publisher: {
      '@type': 'Organization',
      name,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 112,
        height: 112,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList schema for navigation hierarchy
 */
export function BreadcrumbListSchema({ 
  items,
  siteUrl = defaultSiteInfo.url 
}: BreadcrumbListProps) {
  // Default breadcrumbs if none provided
  const defaultItems: BreadcrumbItem[] = [
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
      item: {
        '@type': 'Thing',
        '@id': item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
        name: item.name
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
 * Organization schema with social profiles
 */
export function OrganizationSchema({
  name = defaultSiteInfo.name,
  url = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl,
  description = 'AI-powered coding education platform with interactive courses, quizzes, and learning tools',
  foundingDate = '2023-01-01',
  sameAs = [],
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
 * FAQ Page schema
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
      
      {faq && <FAQSchema items={faq.items || defaultFAQItems} />}
    </>
  );
}

/**
 * Course Schema component for SEO
 * Use this on course pages
 */
export function CourseSchema(props: Omit<CourseData, '@context' | '@type'>) {
  const { name: courseName, description, url: courseUrl, provider, imageUrl, dateCreated, dateModified, author } = props;
  
  const schema = SchemaGenerators.generateCourseSchema({
    name: courseName,
    description,
    url: courseUrl,
    provider: {
      name: provider?.name || 'CourseAI',
      url: provider?.url || BASE_URL,
    },
    imageUrl,
    dateCreated,
    dateModified,
    author: author ? {
      name: author.name,
      url: author.url,
    } : undefined,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Quiz Schema component for SEO
 * Use this on quiz pages
 */
export function QuizSchema(props: Omit<QuizData, '@context' | '@type'>) {
  const schema = SchemaGenerators.generateQuizSchema(props);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Dynamic BreadcrumbList Schema component for SEO
 * Use this on pages with dynamic breadcrumbs
 */
export function DynamicBreadcrumbSchema({ 
  items,
  siteUrl = BASE_URL 
}: BreadcrumbListProps) {
  // Ensure items are properly formatted
  const breadcrumbItems = items?.map(item => ({
    position: item.position,
    name: item.name,
    url: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
  })) || [];

  const schema = SchemaGenerators.generateBreadcrumbSchema(breadcrumbItems);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
