/**
 * CourseAI Schema Components
 * React components for structured data rendering
 */

import React from 'react'
import type {
  BaseSchema,
  OrganizationSchema as OrganizationSchemaType,
  CourseSchema as CourseSchemaType,
  QuizSchema as QuizSchemaType,
  FAQSchema as FAQSchemaType,
  BreadcrumbSchema as BreadcrumbSchemaType,
} from './schema-types'
import { SchemaGenerator } from './schema-types'

interface SchemaScriptProps {
  schema: BaseSchema | BaseSchema[]
  id?: string
}

/**
 * Schema.org JSON-LD Script Component
 */
export const SchemaScript: React.FC<SchemaScriptProps> = ({ schema, id }) => {
  const schemaData = Array.isArray(schema) ? schema : [schema]

  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData, null, 0),
      }}
    />
  )
}

/**
 * Organization Schema Component
 */
export const OrganizationSchemaComponent: React.FC<Partial<OrganizationSchemaType>> = (props) => {
  const generator = new SchemaGenerator()
  const schema = generator.generateOrganization(props)
  return <SchemaScript schema={schema} id="organization-schema" />
}

export const OrganizationSchema = OrganizationSchemaComponent

/**
 * Course Schema Component
 */
export const CourseSchemaComponent: React.FC<{
  course?: Parameters<SchemaGenerator['generateCourse']>[0]
}> = ({ course }) => {
  if (!course || typeof course !== 'object' || !course.name || !course.description || !course.url) {
    return null
  }
  const generator = new SchemaGenerator()
  const schema = generator.generateCourse(course)
  return <SchemaScript schema={schema} id="course-schema" />
}

export const CourseSchema = CourseSchemaComponent

/**
 * Quiz Schema Component
 */
export const QuizSchemaComponent: React.FC<{
  quiz?: Parameters<SchemaGenerator['generateQuiz']>[0]
}> = ({ quiz }) => {
  if (!quiz || typeof quiz !== 'object' || !quiz.name || !quiz.description) {
    return null
  }
  const generator = new SchemaGenerator()
  const schema = generator.generateQuiz(quiz)
  return <SchemaScript schema={schema} id="quiz-schema" />
}

export const QuizSchema = QuizSchemaComponent

/**
 * FAQ Schema Component
 */
export const FAQSchemaComponent: React.FC<{
  faqs?: Parameters<SchemaGenerator['generateFAQ']>[0]
  items?: Parameters<SchemaGenerator['generateFAQ']>[0]
}> = ({ faqs, items }) => {
  const faqData = faqs || items
  if (!faqData || !Array.isArray(faqData) || faqData.length === 0) {
    return null
  }
  const generator = new SchemaGenerator()
  const schema = generator.generateFAQ(faqData)
  return <SchemaScript schema={schema} id="faq-schema" />
}

export const FAQSchema = FAQSchemaComponent

/**
 * Breadcrumb Schema Component
 */
export const BreadcrumbSchemaComponent: React.FC<{
  items?: Parameters<SchemaGenerator['generateBreadcrumb']>[0]
}> = ({ items }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return null
  }
  const generator = new SchemaGenerator()
  const schema = generator.generateBreadcrumb(items)
  return <SchemaScript schema={schema} id="breadcrumb-schema" />
}

export const BreadcrumbSchema = BreadcrumbSchemaComponent

/**
 * Article Schema Component
 */
export const ArticleSchemaComponent: React.FC<{
  article?: Parameters<SchemaGenerator['generateArticle']>[0]
}> = ({ article }) => {
  if (!article || typeof article !== 'object' || !article.headline || !article.description || !article.datePublished || !article.url) {
    return null
  }
  const generator = new SchemaGenerator()
  const schema = generator.generateArticle(article)
  return <SchemaScript schema={schema} id="article-schema" />
}

export const ArticleSchema = ArticleSchemaComponent