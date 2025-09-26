/**
 * Enhanced SEO Components with Google Schema compliance
 * Maintains existing API while adding comprehensive functionality
 */

import React from "react"

import { defaultSiteInfo, defaultFAQItems, defaultSocialProfiles, DEFAULT_ORGANIZATION_DATA } from "./constants"
import type {
  CombinedSchemaProps,
  CourseSchemaProps,
  FAQProps,
  JsonLdProps,
  BreadcrumbListProps,
  OrganizationProps,
  FaqItem,
  QuizSchemaProps,
} from "./seo-schema"
import { schemaFactory } from "./seo-schema"

// ============================================================================
// CORE JSON-LD COMPONENT
// ============================================================================

export const JsonLD = React.memo(function JsonLD({ type, data = {}, scriptProps }: JsonLdProps) {
  const schema = React.useMemo(() => {
    try {
      return schemaFactory.createSchema({
        type: type as any,
        data,
        validation: process.env.NODE_ENV === "development",
        minify: process.env.NODE_ENV === "production",
      })
    } catch (error) {
      console.warn(`SEO: Failed to create ${type} schema:`, error)
      return null
    }
  }, [type, data])

  const jsonString = React.useMemo(() => {
    if (!schema) return "{}"
    try {
      return JSON.stringify(schema, null, process.env.NODE_ENV === "development" ? 2 : 0)
    } catch (error) {
      console.warn("SEO: Failed to serialize schema data", error)
      return "{}"
    }
  }, [schema])

  if (!schema) return null

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonString }} {...scriptProps} />
})

// ============================================================================
// WEBSITE SCHEMA COMPONENT
// ============================================================================

export interface WebsiteSchemaProps {
  siteName?: string
  siteUrl?: string
  logoUrl?: string
  description?: string
  searchUrl?: string
  inLanguage?: string
  copyrightYear?: number
  copyrightHolder?: string
}

export const WebsiteSchema = React.memo(function WebsiteSchema({
  siteName = defaultSiteInfo.name,
  siteUrl = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl,
  description = "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
  searchUrl,
  inLanguage = "en-US",
  copyrightYear = new Date().getFullYear(),
  copyrightHolder = siteName,
}: WebsiteSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      name: siteName,
      url: siteUrl,
      description,
      inLanguage,
      copyrightYear,
      copyrightHolder: {
        "@type": "Organization",
        name: copyrightHolder,
        url: siteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: siteName,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: 112,
          height: 112,
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: searchUrl || `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),
    [siteName, siteUrl, logoUrl, description, searchUrl, inLanguage, copyrightYear, copyrightHolder],
  )

  return <JsonLD type="WebSite" data={schemaData} />
})

// ============================================================================
// BREADCRUMB LIST SCHEMA COMPONENT
// ============================================================================

export interface BreadcrumbListSchemaProps extends BreadcrumbListProps {
  siteUrl?: string
  autoGenerate?: boolean
  currentPath?: string
  customLabels?: Record<string, string>
}

export const BreadcrumbListSchema = React.memo(function BreadcrumbListSchema({
  items,
  siteUrl = defaultSiteInfo.url,
  autoGenerate = false,
  currentPath,
  customLabels = {},
}: BreadcrumbListSchemaProps) {
  const breadcrumbItems = React.useMemo(() => {
    if (items && items.length > 0) {
      return items
    }

    if (autoGenerate && currentPath) {
      const segments = currentPath
        .replace(/^\/+|\/+$/g, "")
        .split("/")
        .filter(Boolean)
      const generatedItems = [{ position: 1, name: "Home", url: "/" }]

      let currentUrl = ""
      segments.forEach((segment, index) => {
        currentUrl += `/${segment}`
        const name =
          customLabels[segment] ||
          segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")

        generatedItems.push({
          position: index + 2,
          name,
          url: currentUrl,
        })
      })

      return generatedItems
    }

    return [
      { position: 1, name: "Home", url: "/" },
      { position: 2, name: "Courses", url: "/courses" },
      { position: 3, name: "About", url: "/about" },
    ]
  }, [items, autoGenerate, currentPath, customLabels])

  const schemaData = React.useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item) => ({
        "@type": "ListItem",
        position: item.position,
        name: item.name,
        item: {
          "@type": "WebPage",
          "@id": item.url.startsWith("http")
            ? item.url
            : `${siteUrl}${item.url.startsWith("/") ? item.url : "/" + item.url}`,
          name: item.name,
          url: item.url.startsWith("http")
            ? item.url
            : `${siteUrl}${item.url.startsWith("/") ? item.url : "/" + item.url}`,
        },
      })),
    }),
    [breadcrumbItems, siteUrl],
  )

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData, null, process.env.NODE_ENV === "development" ? 2 : 0),
      }}
    />
  )
})

// ============================================================================
// ORGANIZATION SCHEMA COMPONENT
// ============================================================================

export interface OrganizationSchemaProps extends OrganizationProps {
  logoUrl?: string
  email?: string
  telephone?: string
  address?: Record<string, any>
  businessHours?: Array<{
    dayOfWeek: string
    opens: string
    closes: string
  }>
  services?: string[]
  areaServed?: string | string[]
}

export const OrganizationSchema = React.memo(function OrganizationSchema({
  name = defaultSiteInfo.name,
  url = defaultSiteInfo.url,
  logoUrl = defaultSiteInfo.logoUrl,
  description = "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
  foundingDate = "2023-01-01",
  sameAs = defaultSocialProfiles,
  email = "support@courseai.io",
  telephone,
  address,
  businessHours,
  services,
  areaServed,
}: OrganizationSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      ...DEFAULT_ORGANIZATION_DATA,
      name,
      url,
      logo: logoUrl,
      description,
      foundingDate,
      sameAs,
      contactPoint: {
        contactType: "customer support",
        email,
        telephone,
        url: `${url}/contact`,
      },
      address,
      openingHoursSpecification: businessHours,
      areaServed,
      ...(services &&
        services.length > 0 && {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Educational Services",
            itemListElement: services.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service,
              },
            })),
          },
        }),
    }),
    [
      name,
      url,
      logoUrl,
      description,
      foundingDate,
      sameAs,
      email,
      telephone,
      address,
      businessHours,
      services,
      areaServed,
    ],
  )

  return <JsonLD type="Organization" data={schemaData} />
})

// ============================================================================
// FAQ SCHEMA COMPONENT
// ============================================================================

export const FAQSchema = React.memo(function FAQSchema({ items = [] }: FAQProps) {
  const validItems = React.useMemo(() => {
    return items.filter(
      (item: FaqItem) =>
        item &&
        typeof item.question === "string" &&
        typeof item.answer === "string" &&
        item.question.trim().length > 0 &&
        item.answer.trim().length > 0,
    )
  }, [items])

  const schemaData = React.useMemo(
    () => ({
      mainEntity: validItems.map((item: FaqItem) => ({
        "@type": "Question",
        name: item.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer.trim(),
        },
      })),
    }),
    [validItems],
  )

  if (validItems.length === 0) {
    return null
  }

  return <JsonLD type="FAQPage" data={schemaData} />
})

// ============================================================================
// COURSE SCHEMA COMPONENT
// ============================================================================

export interface EnhancedCourseSchemaProps extends CourseSchemaProps {
  difficulty?: "Beginner" | "Intermediate" | "Advanced"
  duration?: string
  prerequisites?: string[]
  learningOutcomes?: string[]
  category?: string
  language?: string
  price?: number
  currency?: string
  rating?: {
    value: number
    count: number
  }
  offers?: Array<{
    price: string
    priceCurrency: string
    availability?: string
    url?: string
  }>
}

export const CourseSchema = React.memo(function CourseSchema({
  courseName,
  courseUrl,
  description,
  provider = "CourseAI",
  providerUrl = "https://courseai.io",
  imageUrl,
  dateCreated = new Date().toISOString(),
  dateModified = new Date().toISOString(),
  authorName,
  authorUrl,
  difficulty,
  duration,
  prerequisites,
  learningOutcomes,
  category,
  language = "en",
  price,
  currency = "USD",
  rating,
  offers,
}: EnhancedCourseSchemaProps) {
  const schemaData = React.useMemo(() => {
    const data: any = {
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": courseUrl,
      mainEntity: {
        "@type": "Course",
        name: courseName,
        description,
        url: courseUrl,
        provider: {
          "@type": "Organization",
          name: provider,
          url: providerUrl,
        },
        image: imageUrl ? {
          "@type": "ImageObject",
          url: imageUrl,
        } : undefined,
        dateCreated,
        dateModified,
        inLanguage: language,
        educationalLevel: difficulty,
        timeRequired: duration,
        about: category ? {
          "@type": "Thing", 
          name: category
        } : undefined,
        teaches: learningOutcomes,
        coursePrerequisites: prerequisites?.map((prereq) => ({
          "@type": "AlignmentObject",
          alignmentType: "prerequisite",
          targetName: prereq,
        })),
        // CRITICAL: Add hasCourseInstance to mainEntity - REQUIRED by Google
        hasCourseInstance: [
          {
            "@type": "CourseInstance",
            "@id": `${courseUrl}#instance-main`,
            name: courseName,
            description,
            courseMode: "online",
            location: {
              "@type": "VirtualLocation",
              url: courseUrl,
              name: "CourseAI Online Platform",
            },
            startDate: dateCreated,
            endDate: dateModified,
            instructor: authorName ? {
              "@type": "Person",
              name: authorName,
              url: authorUrl || providerUrl,
            } : {
              "@type": "Organization",
              name: provider,
              url: providerUrl,
            },
          }
        ],
      },
      name: courseName,
      description,
      url: courseUrl,
      provider: {
        "@type": "Organization",
        name: provider,
        url: providerUrl,
      },
      image: imageUrl,
      dateCreated,
      dateModified,
      inLanguage: language,
      educationalLevel: difficulty,
      timeRequired: duration,
      about: category ? { 
        "@type": "Thing",
        name: category 
      } : undefined,
      teaches: learningOutcomes,
      coursePrerequisites: prerequisites?.map((prereq) => ({
        "@type": "AlignmentObject",
        alignmentType: "prerequisite",
        targetName: prereq,
      })),
      // CRITICAL: Add hasCourseInstance - REQUIRED by Google Search Console
      hasCourseInstance: [
        {
          "@type": "CourseInstance",
          "@id": `${courseUrl}#instance-1`,
          name: courseName,
          description,
          courseMode: "online",
          location: {
            "@type": "VirtualLocation",
            url: courseUrl,
            name: "CourseAI Online Platform",
          },
          startDate: dateCreated,
          endDate: dateModified,
          instructor: authorName ? {
            "@type": "Person",
            name: authorName,
            url: authorUrl || providerUrl,
          } : {
            "@type": "Organization",
            name: provider,
            url: providerUrl,
          },
        }
      ],
    }

    if (authorName) {
      data.author = {
        "@type": "Person",
        name: authorName,
        url: authorUrl,
      }
      data.mainEntity.author = {
        "@type": "Person",
        name: authorName,
        url: authorUrl,
      }
    }

    if (offers) {
      data.offers = offers.map(offer => ({
        "@type": "Offer",
        ...offer
      }))
      data.mainEntity.offers = data.offers
    } else if (typeof price === "number") {
      const offerData = {
        "@type": "Offer",
        price: price.toString(),
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        url: courseUrl,
      }
      data.offers = [offerData]
      data.mainEntity.offers = [offerData]
    }

    if (rating && rating.value && rating.count) {
      const ratingData = {
        "@type": "AggregateRating",
        ratingValue: rating.value,
        reviewCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      }
      data.aggregateRating = ratingData
      data.mainEntity.aggregateRating = ratingData
    }

    return data
  }, [
    courseName,
    courseUrl,
    description,
    provider,
    providerUrl,
    imageUrl,
    dateCreated,
    dateModified,
    authorName,
    authorUrl,
    difficulty,
    duration,
    prerequisites,
    learningOutcomes,
    category,
    language,
    price,
    currency,
    rating,
    offers,
  ])

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData, null, process.env.NODE_ENV === "development" ? 2 : 0),
      }}
    />
  )
})

// ============================================================================
// QUIZ SCHEMA COMPONENT
// ============================================================================

export interface EnhancedQuizSchemaProps extends QuizSchemaProps {
  difficulty?: string
  timeRequired?: string
  educationalUse?: string
  learningResourceType?: string
  creator?: {
    name: string
    url?: string
  }
  dateCreated?: string
  dateModified?: string
  category?: string
  inLanguage?: string
}

export const QuizSchema = React.memo(function QuizSchema({
  name,
  url: quizUrl,
  description,
  questions,
  numberOfQuestions,
  difficulty,
  timeRequired,
  educationalUse = "assessment",
  learningResourceType = "Quiz",
  creator,
  dateCreated,
  dateModified,
  category,
  inLanguage = "en",
}: EnhancedQuizSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      name,
      description,
      url: quizUrl,
      numberOfQuestions: numberOfQuestions || questions?.length || 0,
      educationalUse,
      learningResourceType,
      educationalLevel: difficulty,
      timeRequired,
      dateCreated,
      dateModified,
      inLanguage,
      creator,
      about: category ? { name: category } : undefined,
      questions:
        questions && Array.isArray(questions)
          ? questions.map((q: any) => ({
              question: q.question || q.name,
              answer: q.answer || q.correctAnswer,
            }))
          : undefined,
    }),
    [
      name,
      quizUrl,
      description,
      questions,
      numberOfQuestions,
      difficulty,
      timeRequired,
      educationalUse,
      learningResourceType,
      creator,
      dateCreated,
      dateModified,
      category,
      inLanguage,
    ],
  )

  return <JsonLD type="Quiz" data={schemaData} />
})

// ============================================================================
// DEFAULT SEO COMPONENT
// ============================================================================

export interface EnhancedDefaultSEOProps extends CombinedSchemaProps {
  enableWebsite?: boolean
  enableBreadcrumbs?: boolean
  enableOrganization?: boolean
  enableFAQ?: boolean
  currentPath?: string
  customBreadcrumbLabels?: Record<string, string>
}

export const DefaultSEO = React.memo(function DefaultSEO({
  siteInfo = defaultSiteInfo,
  organization,
  faqItems,
  includeFAQ,
  enableWebsite = true,
  enableBreadcrumbs = true,
  enableOrganization = true,
  enableFAQ = true,
  currentPath,
  customBreadcrumbLabels,
}: EnhancedDefaultSEOProps) {
  const orgProps = React.useMemo(
    () => (organization && typeof organization === "object" ? organization : {}),
    [organization],
  )

  const faqs = React.useMemo(() => (Array.isArray(faqItems) ? faqItems : defaultFAQItems), [faqItems])

  return (
    <>
      {enableWebsite && <WebsiteSchema siteName={siteInfo.name} siteUrl={siteInfo.url} logoUrl={siteInfo.logoUrl} />}
      {enableBreadcrumbs && (
        <BreadcrumbListSchema
          siteUrl={siteInfo.url}
          autoGenerate={!!currentPath}
          currentPath={currentPath}
          customLabels={customBreadcrumbLabels}
        />
      )}
      {enableOrganization && <OrganizationSchema {...orgProps} />}
      {enableFAQ && (includeFAQ || faqs.length > 0) && <FAQSchema items={faqs} />}
    </>
  )
})

// ============================================================================
// ADDITIONAL SCHEMA COMPONENTS
// ============================================================================

export interface ArticleSchemaProps {
  headline: string
  description: string
  url: string
  imageUrl?: string
  datePublished: string
  dateModified?: string
  authorName: string
  authorUrl?: string
  publisherName?: string
  publisherUrl?: string
  publisherLogoUrl?: string
  articleType?: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle"
  keywords?: string[]
  wordCount?: number
  articleSection?: string
}

export const ArticleSchema = React.memo(function ArticleSchema({
  headline,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  publisherName = defaultSiteInfo.name,
  publisherUrl = defaultSiteInfo.url,
  publisherLogoUrl = defaultSiteInfo.logoUrl,
  articleType = "Article",
  keywords,
  wordCount,
  articleSection,
}: ArticleSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      headline,
      description,
      url,
      image: imageUrl,
      datePublished,
      dateModified,
      author: {
        name: authorName,
        url: authorUrl,
      },
      publisher: {
        name: publisherName,
        url: publisherUrl,
        logo: publisherLogoUrl,
      },
      articleType,
      keywords,
      wordCount,
      articleSection,
      mainEntityOfPage: url,
    }),
    [
      headline,
      description,
      url,
      imageUrl,
      datePublished,
      dateModified,
      authorName,
      authorUrl,
      publisherName,
      publisherUrl,
      publisherLogoUrl,
      articleType,
      keywords,
      wordCount,
      articleSection,
    ],
  )

  return <JsonLD type="Article" data={schemaData} />
})

export interface ProductSchemaProps {
  name: string
  description: string
  imageUrl?: string
  brand?: string
  model?: string
  sku?: string
  price?: number
  currency?: string
  availability?: string
  rating?: {
    value: number
    count: number
  }
  category?: string
  url?: string
}

export const ProductSchema = React.memo(function ProductSchema({
  name,
  description,
  imageUrl,
  brand,
  model,
  sku,
  price,
  currency = "USD",
  availability = "https://schema.org/InStock",
  rating,
  category,
  url,
}: ProductSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      name,
      description,
      image: imageUrl,
      brand,
      model,
      sku,
      category,
      url,
      offers: price
        ? {
            price: price.toString(),
            priceCurrency: currency,
            availability,
          }
        : undefined,
      aggregateRating: rating
        ? {
            ratingValue: rating.value,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    }),
    [name, description, imageUrl, brand, model, sku, price, currency, availability, rating, category, url],
  )

  return <JsonLD type="Product" data={schemaData} />
})

export interface EventSchemaProps {
  name: string
  description: string
  startDate: string
  endDate?: string
  location: {
    name: string
    address?: string
    url?: string
  }
  organizer?: {
    name: string
    url?: string
  }
  imageUrl?: string
  url?: string
  eventType?: "Event" | "EducationEvent" | "BusinessEvent"
  offers?: {
    price: string
    currency: string
    url?: string
  }
}

export const EventSchema = React.memo(function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  organizer,
  imageUrl,
  url,
  eventType = "Event",
  offers,
}: EventSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      name,
      description,
      startDate,
      endDate,
      location,
      organizer,
      image: imageUrl,
      url,
      eventType,
      offers,
      eventStatus: "https://schema.org/EventScheduled",
    }),
    [name, description, startDate, endDate, location, organizer, imageUrl, url, eventType, offers],
  )

  return <JsonLD type="Event" data={schemaData} />
})

export interface VideoSchemaProps {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
  duration?: string
  publisherName?: string
  publisherUrl?: string
}

export const VideoSchema = React.memo(function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  embedUrl,
  duration,
  publisherName = defaultSiteInfo.name,
  publisherUrl = defaultSiteInfo.url,
}: VideoSchemaProps) {
  const schemaData = React.useMemo(
    () => ({
      name,
      description,
      thumbnailUrl,
      uploadDate,
      contentUrl,
      embedUrl,
      duration,
      publisher: {
        name: publisherName,
        url: publisherUrl,
      },
    }),
    [name, description, thumbnailUrl, uploadDate, contentUrl, embedUrl, duration, publisherName, publisherUrl],
  )

  return <JsonLD type="VideoObject" data={schemaData} />
})
