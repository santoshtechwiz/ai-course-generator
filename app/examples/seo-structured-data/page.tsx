'use client';

import { usePathname } from 'next/navigation';
import { 
  WebsiteSchema, 
  BreadcrumbListSchema, 
  OrganizationSchema, 
  CombinedSEOSchema 
} from '@/app/utils/seo-schemas';
import FAQSchema, { defaultFAQItems } from '@/app/schema/components/FAQSchema';

/**
 * This is an example page component showing how to implement
 * modern JSON-LD schema.org structured data for SEO
 * 
 * It demonstrates the requested implementation:
 * 1. WebSite schema with search box
 * 2. BreadcrumbList schema
 * 3. Organization schema
 * 4. FAQ schema
 */
export default function StructuredDataExamplePage() {
  const pathname = usePathname();
  
  // Generate dynamic breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const segments = pathname?.split('/').filter(Boolean) || [];
    const breadcrumbs = [
      { position: 1, name: 'Home', url: '/' }
    ];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      breadcrumbs.push({
        position: index + 2, // +2 because Home is position 1
        name,
        url: currentPath
      });
    });
    
    return breadcrumbs;
  };
  
  // Social media profiles for Organization schema
  const socialProfiles = [
    'https://twitter.com/courseai',
    'https://github.com/courseai',
    'https://linkedin.com/company/courseai',
    'https://facebook.com/courseailearning'
  ];
  
  // Example FAQ items (using the default ones from our FAQSchema component)
  const faqItems = defaultFAQItems;
  
  return (
    <div className="container mx-auto py-8">
      {/* Method 1: Using separate schema components */}
      <WebsiteSchema 
        name="CourseAI"
        url="https://courseai.io"
        logoUrl="https://courseai.io/logo.png"
      />
      
      <BreadcrumbListSchema 
        items={generateBreadcrumbs()}
        siteUrl="https://courseai.io"
      />
      
      <OrganizationSchema
        name="CourseAI"
        url="https://courseai.io"
        logoUrl="https://courseai.io/logo.png"
        sameAs={socialProfiles}
      />
      
      <FAQSchema items={faqItems} />
      
      {/* Method 2: Using the combined component */}
      {/* 
      <CombinedSEOSchema 
        siteInfo={{
          name: 'CourseAI',
          url: 'https://courseai.io',
          logoUrl: 'https://courseai.io/logo.png'
        }}
        breadcrumbs={{
          items: generateBreadcrumbs()
        }}
        organization={{
          sameAs: socialProfiles
        }}
        faq={{
          items: faqItems
        }}
      />
      */}
      
      <h1 className="text-3xl font-bold">Schema.org Structured Data Examples</h1>
      <p className="mt-4">
        This page demonstrates the implementation of modern JSON-LD structured data for SEO.
        View the page source to see the generated schema.
      </p>
      
      <h2 className="text-2xl font-semibold mt-8">Implemented Schemas:</h2>
      <ul className="list-disc ml-8 mt-4">
        <li>WebSite schema with search box</li>
        <li>BreadcrumbList schema for navigation hierarchy</li>
        <li>Organization schema with social profiles</li>
        <li>FAQ schema with common questions</li>
      </ul>
      
      <div className="mt-12 p-6 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
        <div className="mt-4 space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border-b border-gray-100 pb-4">
              <h4 className="font-medium">{item.question}</h4>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
