/**
 * @deprecated Import from '@/lib/seo-manager-new' instead
 * This file is kept for backward compatibility and will be removed in a future version.
 */

import {
  SchemaRegistry as newSchemaRegistry,
  OrganizationSchema,
  generateBreadcrumbs
} from './seo-manager-new';

export type {
  Schema,
  BreadcrumbItem,
  FAQItem,
  HowToData,
  PersonData,
  VideoData,
  ArticleData,
  CourseData,
  QuizData
} from './seo-manager-new';

// Re-export
export const SchemaRegistry = newSchemaRegistry;
export const OrganizationSchemaAlias = OrganizationSchema;
export const generateBreadcrumbsAlias = generateBreadcrumbs;
