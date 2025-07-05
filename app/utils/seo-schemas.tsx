import React from 'react';

interface SiteInfo {
  name?: string;
  url?: string;
  logoUrl?: string;
}

const defaultSiteInfo: SiteInfo = {
  name: 'CourseAI',
  url: 'https://courseai.io',
  logoUrl: 'https://courseai.io/logo.png',
};

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
interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

interface BreadcrumbListProps {
  items?: BreadcrumbItem[];
  siteUrl?: string;
}

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
 * Organization schema with social profiles
 */
interface OrganizationProps extends SiteInfo {
  description?: string;
  foundingDate?: string;
  sameAs?: string[]; // Social profile URLs
  email?: string;
  telephone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

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
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

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
interface CombinedSchemaProps {
  website?: boolean;
  breadcrumbs?: boolean | BreadcrumbListProps;
  organization?: boolean | OrganizationProps;
  faq?: FAQProps;
  siteInfo?: SiteInfo;
}

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
