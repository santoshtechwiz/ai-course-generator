/**
 * Advanced Metadata Generator
 * Comprehensive metadata generation with SEO best practices
 */

import type { Metadata } from "next"
import { MetadataOptions, SiteInfo } from "./seo-schema"
import { BASE_URL, defaultSiteInfo } from "./constants"

export interface AdvancedMetadataOptions extends MetadataOptions {
  siteName?: string
  locale?: string
  alternateLocales?: string[]
  robots?: {
    index?: boolean
    follow?: boolean
    noarchive?: boolean
    nosnippet?: boolean
    noimageindex?: boolean
    nocache?: boolean
    maxImagePreview?: "none" | "standard" | "large"
    maxSnippet?: number
    maxVideoPreview?: number
  }
  verification?: {
    google?: string
    bing?: string
    yandex?: string
    pinterest?: string
    facebook?: string
  }
  manifest?: string
  themeColor?: string
  colorScheme?: "light" | "dark" | "light dark"
  category?: string
  classification?: string
  coverage?: string
  distribution?: string
  rating?: string
  referrer?: string
  revisitAfter?: string
  subject?: string
  summary?: string
  topic?: string
  abstract?: string
  language?: string
  pageTopic?: string
  pageType?: string
  audience?: string
  contentRating?: string
}

export class MetadataGenerator {
  private static instance: MetadataGenerator
  private siteInfo: SiteInfo

  private constructor(siteInfo: SiteInfo = defaultSiteInfo) {
    this.siteInfo = siteInfo
  }

  public static getInstance(siteInfo?: SiteInfo): MetadataGenerator {
    if (!MetadataGenerator.instance) {
      MetadataGenerator.instance = new MetadataGenerator(siteInfo)
    }
    return MetadataGenerator.instance
  }

  public generateMetadata(options: AdvancedMetadataOptions): Metadata {
    const {
      title,
      description,
      canonicalPath,
      path,
      ogImage,
      ogType = "website",
      noIndex = false,
      keywords = [],
      siteName = this.siteInfo.name,
      locale = "en_US",
      alternateLocales = [],
      robots,
      verification,
      manifest,
      themeColor,
      colorScheme,
      category,
      classification,
      coverage,
      distribution,
      rating,
      referrer,
      revisitAfter,
      subject,
      summary,
      topic,
      abstract,
      language,
      pageTopic,
      pageType,
      audience,
      contentRating,
    } = options

    const baseUrl = BASE_URL
    const fullUrl = canonicalPath || path ? `${baseUrl}${canonicalPath || path}` : baseUrl

    // Generate optimized images
    const ogImageData = this.generateOpenGraphImages(title, ogImage, baseUrl, siteName)

    // Build comprehensive robots configuration
    const robotsConfig = this.buildRobotsConfig(noIndex, robots)

    // Build additional meta tags
    const additionalMeta = this.buildAdditionalMetaTags({
      category,
      classification,
      coverage,
      distribution,
      rating,
      referrer,
      revisitAfter,
      subject,
      summary,
      topic,
      abstract,
      language,
      pageTopic,
      pageType,
      audience,
      contentRating,
    })

    const metadata: Metadata = {
      title,
      description,
      ...(keywords.length > 0 && { keywords: keywords.join(", ") }),
      robots: robotsConfig,
      openGraph: {
        title,
        description,
        type: ogType as any,
        url: fullUrl,
        images: ogImageData,
        siteName,
        locale,
        ...(alternateLocales.length > 0 && { alternateLocale: alternateLocales }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImageData.map((img) => img.url),
        creator: "@courseai",
        site: "@courseai",
      },
      alternates: {
        canonical: fullUrl,
      },
      ...(verification && { verification }),
      ...(manifest && { manifest }),
      ...(themeColor && { themeColor }),
      ...(colorScheme && { colorScheme }),
      other: additionalMeta,
    }

    return this.cleanMetadata(metadata)
  }

  private generateOpenGraphImages(
    title?: string,
    ogImage?: string | { url: string; alt?: string; width?: number; height?: number },
    baseUrl?: string,
    siteName?: string,
  ) {
    if (typeof ogImage === "string") {
      return [
        {
          url: ogImage.startsWith("http") ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteName}`,
        },
      ]
    } else if (ogImage && typeof ogImage === "object") {
      return [
        {
          url: ogImage.url.startsWith("http") ? ogImage.url : `${baseUrl}${ogImage.url}`,
          width: ogImage.width || 1200,
          height: ogImage.height || 630,
          alt: ogImage.alt || `${title} | ${siteName}`,
        },
      ]
    } else {
      return [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title || "")}`,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteName}`,
        },
      ]
    }
  }

  private buildRobotsConfig(noIndex: boolean, robots?: AdvancedMetadataOptions["robots"]) {
    return {
      index: !noIndex && robots?.index !== false,
      follow: robots?.follow !== false,
      ...(robots?.noarchive && { noarchive: true }),
      ...(robots?.nosnippet && { nosnippet: true }),
      ...(robots?.noimageindex && { noimageindex: true }),
      ...(robots?.nocache && { nocache: true }),
      googleBot: {
        index: !noIndex && robots?.index !== false,
        follow: robots?.follow !== false,
        "max-image-preview": robots?.maxImagePreview || "large",
        "max-snippet": robots?.maxSnippet || -1,
        ...(robots?.maxVideoPreview && { "max-video-preview": robots.maxVideoPreview }),
      },
    }
  }

  private buildAdditionalMetaTags(options: Record<string, any>): Record<string, string> {
    const meta: Record<string, string> = {}

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        meta[key] = String(value)
      }
    })

    return meta
  }

  private cleanMetadata(metadata: Metadata): Metadata {
    // Remove undefined values and clean up the metadata object
    return JSON.parse(
      JSON.stringify(metadata, (key, value) => {
        return value === undefined ? undefined : value
      }),
    )
  }
}

export const metadataGenerator = MetadataGenerator.getInstance()
