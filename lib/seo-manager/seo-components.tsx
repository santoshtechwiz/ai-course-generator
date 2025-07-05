/**
 * Pre-built SEO components for common use cases
 */
import { socialProfiles, defaultFAQItems } from './config';
import { generateBreadcrumbs } from './helper-utils';
import { CombinedSEOSchema } from './structured-data/components';

/**
 * Default SEO component for all pages
 * Includes WebSite, BreadcrumbList, and Organization schemas
 */
interface DefaultSEOProps {
  currentPath?: string;
  includeFAQ?: boolean;
  customFAQItems?: Array<{ question: string; answer: string }>;
}

export function DefaultSEO({ currentPath = '/', includeFAQ = false, customFAQItems }: DefaultSEOProps) {
  const breadcrumbs = currentPath ? generateBreadcrumbs(currentPath) : undefined;
  
  return (
    <CombinedSEOSchema
      breadcrumbs={
        breadcrumbs ? { items: breadcrumbs } : true
      }
      organization={{
        sameAs: socialProfiles
      }}
      faq={
        includeFAQ ? {
          items: customFAQItems || defaultFAQItems
        } : undefined
      }
    />
  );
}
