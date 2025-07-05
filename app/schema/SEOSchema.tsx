import React from 'react';
import { WebsiteSchema, BreadcrumbListSchema, OrganizationSchema } from './components/schema-components';

interface SEOSchemaProps {
  siteName?: string;
  siteUrl?: string;
  logoUrl?: string;
  socialProfiles?: string[];
}

/**
 * SEO Schema Component that adds structured data to the website
 * This component should be included in the root layout
 */
export default function SEOSchema({
  siteName = 'CourseAI',
  siteUrl = 'https://courseai.io',
  logoUrl = 'https://courseai.io/logo.png',
  socialProfiles = [
    // Add your social profiles here
    // 'https://twitter.com/courseai',
    // 'https://facebook.com/courseai',
    // 'https://linkedin.com/company/courseai',
  ]
}: SEOSchemaProps) {
  return (
    <>
      <WebsiteSchema 
        siteName={siteName} 
        siteUrl={siteUrl} 
      />
      <BreadcrumbListSchema />
      <OrganizationSchema
        siteName={siteName}
        siteUrl={siteUrl}
        logoUrl={logoUrl}
        socialProfiles={socialProfiles}
      />
    </>
  );
}
