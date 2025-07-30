
import { defaultSiteInfo, defaultFAQItems, defaultSocialProfiles } from './config';
import type {
  CombinedSchemaProps,
  CourseSchemaProps,
  FAQProps,
  JsonLdProps,
  BreadcrumbListProps,
  OrganizationProps,
  FaqItem,
} from './types';


/**
 * Renders a JSON-LD script tag for structured data.
 */
export function JsonLD({ type, data = {} }: JsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}

// Backward compatibility alias
export { JsonLD as JsonLd };


export interface WebsiteSchemaProps {
  siteName?: string;
  siteUrl?: string;
  logoUrl?: string;
}

/**
 * WebsiteSchema - Renders WebSite structured data.
 */
export function WebsiteSchema({
  siteName = defaultSiteInfo.name,
  siteUrl = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl,
}: WebsiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    description:
      'AI-powered coding education platform with interactive courses, quizzes, and learning tools',
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
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}

export interface BreadcrumbListSchemaProps extends BreadcrumbListProps {
  siteUrl?: string;
}

/**
 * BreadcrumbListSchema - Renders BreadcrumbList structured data.
 */
export function BreadcrumbListSchema({
  items,
  siteUrl = defaultSiteInfo.url,
}: BreadcrumbListSchemaProps) {
  const defaultItems = [
    { position: 1, name: 'Home', url: '/' },
    { position: 2, name: 'Courses', url: '/courses' },
    { position: 3, name: 'About', url: '/about' },
  ];
  const breadcrumbItems = items && items.length > 0 ? items : defaultItems;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url.startsWith('/') ? item.url : '/' + item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}

export interface OrganizationSchemaProps extends OrganizationProps {
  logoUrl?: string;
  email?: string;
  telephone?: string;
  address?: Record<string, any>;
}

/**
 * OrganizationSchema - Renders Organization structured data.
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
}: OrganizationSchemaProps) {
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
    ...(sameAs && sameAs.length > 0 && { sameAs }),
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}

/**
 * FAQSchema - Renders FAQPage structured data.
 */
export function FAQSchema({ items = [] }: FAQProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (items || []).map((item: FaqItem) => ({
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}

/**
 * CourseSchema - Renders Course structured data for course pages.
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
  authorUrl,
}: CourseSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseName,
    description,
    url: courseUrl,
    provider: {
      '@type': 'Organization',
      name: provider,
      sameAs: providerUrl,
    },
    ...(imageUrl && { image: imageUrl }),
    dateCreated,
    dateModified,
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
        ...(authorUrl && { url: authorUrl }),
      },
    }),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
}
/**
 * DefaultSEO - Renders all default SEO schemas for a page.
 */
export function DefaultSEO(props: CombinedSchemaProps) {
  const {
    siteInfo = defaultSiteInfo,
    organization,
    faqItems,
    includeFAQ,
  } = props;
  // Defensive: ensure organization is always an object
  const orgProps = organization && typeof organization === 'object' ? organization : {};
  const faqs = Array.isArray(faqItems) ? faqItems : defaultFAQItems;
  return (
    <>
      <WebsiteSchema
        siteName={siteInfo.name}
        siteUrl={siteInfo.url}
        logoUrl={siteInfo.logoUrl}
      />
      <BreadcrumbListSchema siteUrl={siteInfo.url} />
      <OrganizationSchema {...orgProps} />
      {includeFAQ && <FAQSchema items={faqs} />}
    </>
  );
}
