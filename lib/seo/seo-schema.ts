// Minimal schemaFactory implementation for JSON-LD schema creation
export const schemaFactory = {
  createSchema({ type, data, validation, minify }: SchemaFactoryConfig) {
    // Basic schema creation logic; extend as needed
    const schema = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data,
    };
    // Optionally validate or minify here
    return schema;
  },
};
import type React from "react"

// ============================================================================
// CORE SCHEMA TYPES
// ============================================================================

interface BaseSchema {
  "@context": "https://schema.org"
  "@type": string
  "@id"?: string
  [key: string]: any
}

interface ImageObject {
  "@type": "ImageObject"
  url: string
  width?: number
  height?: number
  alt?: string
  caption?: string
}

interface PostalAddress {
  "@type": "PostalAddress"
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

interface ContactPoint {
  "@type": "ContactPoint"
  contactType: string
  email?: string
  telephone?: string
  url?: string
  availableLanguage?: string[]
  hoursAvailable?: OpeningHoursSpecification[]
}

interface OpeningHoursSpecification {
  "@type": "OpeningHoursSpecification"
  dayOfWeek: string | string[]
  opens: string
  closes: string
  validFrom?: string
  validThrough?: string
}

interface Person {
  "@type": "Person"
  name: string
  url?: string
  image?: string | ImageObject
  jobTitle?: string
  description?: string
  sameAs?: string[]
  worksFor?: Organization
  email?: string
  telephone?: string
}

interface Organization {
"@context": "https://schema.org"
  "@type": "Organization"
  "@id"?: string
  name: string
  url?: string
  logo?: string | ImageObject
  description?: string
  foundingDate?: string
  sameAs?: string[]
  contactPoint?: ContactPoint | ContactPoint[]
  address?: PostalAddress
  telephone?: string
  email?: string
  openingHoursSpecification?: OpeningHoursSpecification[]
  areaServed?: string | string[] | Place[]
  hasOfferCatalog?: OfferCatalog
}

interface Place {
  "@type": "Place"
  name: string
  address?: PostalAddress
  geo?: GeoCoordinates
}

interface GeoCoordinates {
  "@type": "GeoCoordinates"
  latitude: number
  longitude: number
}

interface Offer {
  "@type": "Offer"
  price?: string | number
  priceCurrency?: string
  availability?: string
  url?: string
  priceValidUntil?: string
  seller?: Organization | Person
  itemCondition?: string
}

interface OfferCatalog {
  "@type": "OfferCatalog"
  name: string
  itemListElement: Offer[]
}

interface AggregateRating {
  "@type": "AggregateRating"
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}

interface Review {
  "@type": "Review"
  author: Person | Organization
  datePublished?: string
  reviewBody: string
  reviewRating?: Rating
}

interface Rating {
  "@type": "Rating"
  ratingValue: number
  bestRating?: number
  worstRating?: number
}

// ============================================================================
// SPECIFIC SCHEMA TYPES
// ============================================================================

interface WebSiteSchema extends BaseSchema {
  "@type": "WebSite"
  name: string
  url: string
  description?: string
  publisher?: Organization
  potentialAction?: SearchAction | SearchAction[]
  inLanguage?: string
  copyrightYear?: number
  copyrightHolder?: Organization | Person
}

interface SearchAction {
  "@type": "SearchAction"
  target: string
  "query-input": string
}

interface BreadcrumbListSchema extends BaseSchema {
  "@type": "BreadcrumbList"
  itemListElement: ListItem[]
}

interface ListItem {
  "@type": "ListItem"
  position: number
  name: string
  item: string
}

interface FAQPageSchema extends BaseSchema {
  "@type": "FAQPage"
  mainEntity: Question[]
}

interface Question {
  "@type": "Question"
  name: string
  acceptedAnswer: Answer
}

interface Answer {
  "@type": "Answer"
  text: string
  author?: Person | Organization
  dateCreated?: string
  upvoteCount?: number
}

interface CourseSchema extends BaseSchema {
  "@type": "Course"
  name: string
  description: string
  url: string
  provider: Organization
  image?: string | ImageObject
  dateCreated?: string
  dateModified?: string
  author?: Person | Organization
  educationalLevel?: string
  timeRequired?: string
  about?: Thing | Thing[]
  teaches?: string[]
  coursePrerequisites?: AlignmentObject[]
  offers?: Offer | Offer[]
  hasCourseInstance?: CourseInstance[]
  aggregateRating?: AggregateRating
  review?: Review[]
  inLanguage?: string
  learningResourceType?: string
  educationalUse?: string

}

interface CourseInstance {
  "@type": "CourseInstance"
  name?: string
  description?: string
  courseMode?: string
  startDate?: string
  endDate?: string
  location?: Place | string
  instructor?: Person | Person[]
}

interface Thing {
  "@type": "Thing"
  name: string
  description?: string
  url?: string
  image?: string | ImageObject
}

interface AlignmentObject {
  "@type": "AlignmentObject"
  alignmentType: string
  targetName: string
  targetUrl?: string
}

interface QuizSchema extends BaseSchema {
  "@type": "Quiz"
  name: string
  description: string
  url: string
  numberOfQuestions?: number
  creator?: Person | Organization
  dateCreated?: string
  dateModified?: string
  educationalLevel?: string
  timeRequired?: string
  educationalUse?: string
  learningResourceType?: string
  about?: Thing | Thing[]
  mainEntity?: Question[]
  aggregateRating?: AggregateRating
  review?: Review[]
  inLanguage?: string
}

interface ArticleSchema extends BaseSchema {
  "@type": "Article" | "BlogPosting" | "NewsArticle" | "TechArticle"
  headline: string
  description?: string
  url: string
  image?: string | ImageObject | ImageObject[]
  datePublished: string
  dateModified?: string
  author: Person | Organization | (Person | Organization)[]
  publisher: Organization
  mainEntityOfPage?: string
  articleSection?: string
  wordCount?: number
  keywords?: string | string[]
  about?: Thing | Thing[]
  mentions?: Thing | Thing[]
}

interface ProductSchema extends BaseSchema {
  "@type": "Product" | "SoftwareApplication"
  name: string
  description: string
  image?: string | ImageObject | ImageObject[]
  brand?: Organization | string
  manufacturer?: Organization
  model?: string
  sku?: string
  gtin?: string
  offers?: Offer | Offer[]
  aggregateRating?: AggregateRating
  review?: Review[]
  category?: string
  url?: string
  // Software-specific properties
  applicationCategory?: string
  operatingSystem?: string
  softwareVersion?: string
  downloadUrl?: string
  fileSize?: string
  requirements?: string
  releaseNotes?: string
}

interface EventSchema extends BaseSchema {
  "@type": "Event" | "EducationEvent" | "BusinessEvent"
  name: string
  description: string
  startDate: string
  endDate?: string
  location: Place | string
  organizer?: Organization | Person
  performer?: Person | Organization
  offers?: Offer | Offer[]
  image?: string | ImageObject
  url?: string
  eventStatus?: string
  eventAttendanceMode?: string
  maximumAttendeeCapacity?: number
  remainingAttendeeCapacity?: number
}

interface LocalBusinessSchema extends BaseSchema {
  "@type": "LocalBusiness" | "EducationalOrganization"
  name: string
  description?: string
  url?: string
  telephone?: string
  email?: string
  address: PostalAddress
  geo?: GeoCoordinates
  openingHoursSpecification?: OpeningHoursSpecification[]
  priceRange?: string
  paymentAccepted?: string[]
  currenciesAccepted?: string[]
  aggregateRating?: AggregateRating
  review?: Review[]
  image?: string | ImageObject
  logo?: string | ImageObject
  sameAs?: string[]
}

interface VideoObjectSchema extends BaseSchema {
  "@type": "VideoObject"
  name: string
  description: string
  thumbnailUrl: string | string[]
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
  duration?: string
  publisher?: Organization
  creator?: Person | Organization
  width?: number
  height?: number
  videoQuality?: string
  transcript?: string
  caption?: string
}

interface HowToSchema extends BaseSchema {
  "@type": "HowTo"
  name: string
  description: string
  image?: string | ImageObject
  totalTime?: string
  estimatedCost?: MonetaryAmount
  supply?: HowToSupply[]
  tool?: HowToTool[]
  step: HowToStep[]
  video?: VideoObjectSchema
}

interface HowToStep {
  "@type": "HowToStep"
  name: string
  text: string
  url?: string
  image?: string | ImageObject
  video?: VideoObjectSchema
}

interface HowToSupply {
  "@type": "HowToSupply"
  name: string
  image?: string | ImageObject
}

interface HowToTool {
  "@type": "HowToTool"
  name: string
  image?: string | ImageObject
}

interface MonetaryAmount {
  "@type": "MonetaryAmount"
  currency: string
  value: number
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface SiteInfo {
  name?: string
  url?: string
  logoUrl?: string
}

interface BreadcrumbItem {
  position: number
  name: string
  url: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface JsonLdProps {
  type: string
  data?: Record<string, any>
  scriptProps?: React.HTMLAttributes<HTMLScriptElement>
}

export interface BreadcrumbListProps {
  items?: BreadcrumbItem[]
  siteUrl?: string
}

export interface OrganizationProps extends SiteInfo {
  description?: string
  foundingDate?: string
  sameAs?: string[]
  email?: string
  telephone?: string
  address?: Record<string, any>
}

export interface FAQProps {
  items: FaqItem[]
}

export interface CourseSchemaProps {
  courseName: string
  description: string
  courseUrl: string
  provider?: string
  providerUrl?: string
  imageUrl?: string
  dateCreated?: string
  dateModified?: string
  authorName?: string
  authorUrl?: string
}

export interface QuizSchemaProps {
  name: string
  url: string
  description: string
  questions: any[]
  numberOfQuestions?: number
}

export interface CombinedSchemaProps {
  website?: boolean
  breadcrumbs?: boolean | BreadcrumbListProps
  organization?: boolean | OrganizationProps
  faq?: FAQProps
  siteInfo?: SiteInfo
  faqItems?: FaqItem[]
  includeFAQ?: boolean
}

interface MetadataOptions {
  title?: string
  description?: string
  canonicalPath?: string
  path?: string
  ogImage?:
    | string
    | {
        url: string
        alt?: string
        width?: number
        height?: number
      }
  ogType?: string
  noIndex?: boolean
  additionalMetaTags?: Array<{ name: string; content: string }>
  structuredData?: Record<string, any>
  keywords?: string[]
}

// ============================================================================
// SCHEMA FACTORY TYPES
// ============================================================================

type SchemaType =
  | "WebSite"
  | "BreadcrumbList"
  | "Organization"
  | "FAQPage"
  | "Course"
  | "Quiz"
  | "Article"
  | "Product"
  | "Event"
  | "LocalBusiness"
  | "VideoObject"
  | "HowTo"
  | "Person"
  | "Review"

interface SchemaFactoryConfig {
  type: SchemaType
  data: Record<string, any>
  validation?: boolean
  minify?: boolean
}
