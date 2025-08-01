/**
 * Schema Factory - Centralized schema generation with validation
 * Ensures all schemas are properly formatted and Google-compliant
 */

import type {
  BaseSchema,
  SchemaFactoryConfig,
  WebSiteSchema,
  BreadcrumbListSchema,
  Organization,
  FAQPageSchema,
  CourseSchema,
  QuizSchema,
  ArticleSchema,
  ProductSchema,
  EventSchema,
  LocalBusinessSchema,
  VideoObjectSchema,
  HowToSchema,
  Person,
  Review,
} from "./seo-schema"

export class GoogleSchemaFactory {
  private static instance: GoogleSchemaFactory
  private validationEnabled = true

  private constructor() {}

  public static getInstance(): GoogleSchemaFactory {
    if (!GoogleSchemaFactory.instance) {
      GoogleSchemaFactory.instance = new GoogleSchemaFactory()
    }
    return GoogleSchemaFactory.instance
  }

  public setValidation(enabled: boolean): void {
    this.validationEnabled = enabled
  }

  public createSchema(config: SchemaFactoryConfig): BaseSchema {
    const { type, data, validation = this.validationEnabled, minify = true } = config

    let schema: BaseSchema

    switch (type) {
      case "WebSite":
        schema = this.createWebSiteSchema(data)
        break
      case "BreadcrumbList":
        schema = this.createBreadcrumbListSchema(data)
        break
      case "Organization":
        schema = this.createOrganizationSchema(data)
        break
      case "FAQPage":
        schema = this.createFAQPageSchema(data)
        break
      case "Course":
        schema = this.createCourseSchema(data)
        break
      case "Quiz":
        schema = this.createQuizSchema(data)
        break
      case "Article":
        schema = this.createArticleSchema(data)
        break
      case "Product":
        schema = this.createProductSchema(data)
        break
      case "Event":
        schema = this.createEventSchema(data)
        break
      case "LocalBusiness":
        schema = this.createLocalBusinessSchema(data)
        break
      case "VideoObject":
        schema = this.createVideoObjectSchema(data)
        break
      case "HowTo":
        schema = this.createHowToSchema(data)
        break
      case "Person":
        schema = this.createPersonSchema(data)
        break
      case "Review":
        schema = this.createReviewSchema(data)
        break
      default:
        schema = this.createGenericSchema(type, data)
    }

    if (validation) {
      this.validateSchema(schema)
    }

    return this.cleanSchema(schema, minify)
  }

  private createWebSiteSchema(data: any): WebSiteSchema {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": data.url ? `${data.url}/#website` : undefined,
      name: data.name,
      url: data.url,
      description: data.description,
      publisher: data.publisher,
      potentialAction: data.potentialAction || {
        "@type": "SearchAction",
        target: `${data.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      inLanguage: data.inLanguage || "en",
      copyrightYear: data.copyrightYear,
      copyrightHolder: data.copyrightHolder,
    }
  }

  private createBreadcrumbListSchema(data: any): BreadcrumbListSchema {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: (data.items || []).map((item: any, index: number) => ({
        "@type": "ListItem",
        position: item.position || index + 1,
        name: item.name,
        item: item.url || item.item,
      })),
    }
  }

  private createOrganizationSchema(data: any): Organization {
    const schema: Organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": data.url ? `${data.url}/#organization` : undefined,
      name: data.name,
      url: data.url,
      description: data.description,
      foundingDate: data.foundingDate,
      sameAs: data.sameAs,
      telephone: data.telephone,
      email: data.email,
    }

    if (data.logo) {
      schema.logo = typeof data.logo === "string" ? { "@type": "ImageObject", url: data.logo } : data.logo
    }

    if (data.address) {
      schema.address = {
        "@type": "PostalAddress",
        ...data.address,
      }
    }

    if (data.contactPoint) {
      schema.contactPoint = {
        "@type": "ContactPoint",
        contactType: "customer support",
        ...data.contactPoint,
      }
    }

    return schema
  }

  private createFAQPageSchema(data: any): FAQPageSchema {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (data.items || []).map((item: any) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    }
  }

  private createCourseSchema(data: any): CourseSchema {
    const schema: CourseSchema = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: data.name || data.courseName,
      description: data.description,
      url: data.url || data.courseUrl,
      provider: {
          "@type": "Organization",
          name: data.provider || data.providerName || "CourseAI",
          url: data.providerUrl,
          "@context": "https://schema.org"
      },
      dateCreated: data.dateCreated,
      dateModified: data.dateModified,
      inLanguage: data.inLanguage || "en",
      learningResourceType: "Course",
      educationalUse: "instruction",
    }

    if (data.image || data.imageUrl) {
      schema.image = data.image || data.imageUrl
    }

    if (data.author || data.authorName) {
      schema.author = {
        "@type": "Person",
        name: data.author?.name || data.authorName,
        url: data.author?.url || data.authorUrl,
      }
    }

    if (data.educationalLevel) {
      schema.educationalLevel = data.educationalLevel
    }

    if (data.timeRequired) {
      schema.timeRequired = data.timeRequired
    }

    if (data.about) {
      schema.about = Array.isArray(data.about)
        ? data.about.map((item: any) => ({ "@type": "Thing", name: item.name || item }))
        : { "@type": "Thing", name: data.about.name || data.about }
    }

    if (data.offers) {
      schema.offers = Array.isArray(data.offers) ? data.offers : [data.offers]
    }

    return schema
  }

  private createQuizSchema(data: any): QuizSchema {
    const schema: QuizSchema = {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: data.name,
      description: data.description,
      url: data.url,
      numberOfQuestions: data.numberOfQuestions || data.questions?.length || 0,
      educationalUse: "assessment",
      learningResourceType: "Quiz",
      inLanguage: data.inLanguage || "en",
    }

    if (data.creator) {
      schema.creator = {
        "@type": "Person",
        name: data.creator.name || data.creator,
        url: data.creator.url,
      }
    }

    if (data.questions && Array.isArray(data.questions)) {
      schema.mainEntity = data.questions.map((q: any) => ({
        "@type": "Question",
        name: q.question || q.name,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer || q.correctAnswer,
        },
      }))
    }

    return schema
  }

  private createArticleSchema(data: any): ArticleSchema {
    return {
      "@context": "https://schema.org",
      "@type": data.articleType || "Article",
      headline: data.headline || data.title,
      description: data.description,
      url: data.url,
      image: data.image,
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      author: data.author,
      publisher: data.publisher,
      mainEntityOfPage: data.mainEntityOfPage || data.url,
      articleSection: data.articleSection,
      wordCount: data.wordCount,
      keywords: data.keywords,
    }
  }

  private createProductSchema(data: any): ProductSchema {
    return {
      "@context": "https://schema.org",
      "@type": data.productType || "Product",
      name: data.name,
      description: data.description,
      image: data.image,
      brand: data.brand,
      manufacturer: data.manufacturer,
      model: data.model,
      sku: data.sku,
      offers: data.offers,
      aggregateRating: data.aggregateRating,
      review: data.review,
      category: data.category,
      url: data.url,
    }
  }

  private createEventSchema(data: any): EventSchema {
    return {
      "@context": "https://schema.org",
      "@type": data.eventType || "Event",
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      organizer: data.organizer,
      performer: data.performer,
      offers: data.offers,
      image: data.image,
      url: data.url,
      eventStatus: data.eventStatus || "https://schema.org/EventScheduled",
      eventAttendanceMode: data.eventAttendanceMode,
    }
  }

  private createLocalBusinessSchema(data: any): LocalBusinessSchema {
    return {
      "@context": "https://schema.org",
      "@type": data.businessType || "LocalBusiness",
      name: data.name,
      description: data.description,
      url: data.url,
      telephone: data.telephone,
      email: data.email,
      address: {
        "@type": "PostalAddress",
        ...data.address,
      },
      geo: data.geo,
      openingHoursSpecification: data.openingHours,
      priceRange: data.priceRange,
      aggregateRating: data.aggregateRating,
      review: data.review,
      image: data.image,
      logo: data.logo,
      sameAs: data.sameAs,
    }
  }

  private createVideoObjectSchema(data: any): VideoObjectSchema {
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: data.name,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      uploadDate: data.uploadDate,
      contentUrl: data.contentUrl,
      embedUrl: data.embedUrl,
      duration: data.duration,
      publisher: data.publisher,
      creator: data.creator,
      width: data.width,
      height: data.height,
    }
  }

  private createHowToSchema(data: any): HowToSchema {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: data.name,
      description: data.description,
      image: data.image,
      totalTime: data.totalTime,
      estimatedCost: data.estimatedCost,
      supply: data.supply,
      tool: data.tool,
      step: (data.steps || []).map((step: any, index: number) => ({
        "@type": "HowToStep",
        name: step.name || `Step ${index + 1}`,
        text: step.text || step.description,
        url: step.url,
        image: step.image,
      })),
    }
  }

  private createPersonSchema(data: any): Person {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: data.name,
      url: data.url,
      image: data.image,
      jobTitle: data.jobTitle,
      description: data.description,
      sameAs: data.sameAs,
      worksFor: data.worksFor,
      email: data.email,
      telephone: data.telephone,
    }
  }

  private createReviewSchema(data: any): Review {
    return {
      "@context": "https://schema.org",
      "@type": "Review",
      author: data.author,
      datePublished: data.datePublished,
      reviewBody: data.reviewBody,
      reviewRating: data.reviewRating,
    }
  }

  private createGenericSchema(type: string, data: any): BaseSchema {
    return {
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    }
  }

  private validateSchema(schema: BaseSchema): void {
    if (!schema["@context"]) {
      console.warn("Schema missing @context")
    }
    if (!schema["@type"]) {
      console.warn("Schema missing @type")
    }
    // Add more validation rules as needed
  }

  private cleanSchema(schema: BaseSchema, minify: boolean): BaseSchema {
    // Remove undefined values
    const cleaned = JSON.parse(
      JSON.stringify(schema, (key, value) => {
        return value === undefined ? undefined : value
      }),
    )

    return cleaned
  }
}

export const schemaFactory = GoogleSchemaFactory.getInstance()
