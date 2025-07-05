/**
 * @deprecated Import from '@/lib/seo-manager-new' instead
 * This file is kept for backward compatibility and will be removed in a future version.
 */

import { Metadata } from 'next';
import {
  defaultMetadata as newDefaultMetadata,
  generateMetadata as newGenerateMetadata,
  generatePageMetadata as newGeneratePageMetadata,
  generateDynamicMetadata as newGenerateDynamicMetadata,
  generateQuizMetadata as newGenerateQuizMetadata,
  generateCourseMetadata as newGenerateCourseMetadata,
  extractKeywords as newExtractKeywords,
  generateMetaDescription as newGenerateMetaDescription,
  optimizeImageAlt as newOptimizeImageAlt,
  generateJsonLd as newGenerateJsonLd,
  getSocialImageUrl as newGetSocialImageUrl,
  generateSocialImage as newGenerateSocialImage,
  MetadataOptions
} from './seo-manager-new';

// Re-export everything
export {
    generateSocialImage
} from './seo-manager-new';
export type { MetadataOptions } from './seo-manager-new';

// Default metadata
export const defaultMetadata = newDefaultMetadata;

// Metadata generators
export const generateMetadata = newGenerateMetadata;
export const generatePageMetadata = newGeneratePageMetadata;
export const generateDynamicMetadata = newGenerateDynamicMetadata;
export const generateQuizMetadata = newGenerateQuizMetadata;
export const generateCourseMetadata = newGenerateCourseMetadata;

// Utility functions
export const extractKeywords = newExtractKeywords;
export const generateMetaDescription = newGenerateMetaDescription;
export const optimizeImageAlt = newOptimizeImageAlt;
export const generateJsonLd = newGenerateJsonLd;
export const getSocialImageUrl = newGetSocialImageUrl;
