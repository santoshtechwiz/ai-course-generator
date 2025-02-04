// utils/markdownProcessor.ts

import { remark } from 'remark'
import strip from 'strip-markdown'
import remarkGfm from 'remark-gfm'

export function cleanMarkdown(markdown: string): string {
  // Remove any HTML tags
  const withoutHtml = markdown.replace(/<[^>]*>/g, '')

  // Process with remark to standardize markdown
  const processed = remark()
    .use(strip, { keep: ['heading', 'list', 'listItem',  'strong', 'emphasis', 'link'] })
    .use(remarkGfm)
    .processSync(withoutHtml)

  return processed.toString()
}

export function formatMarkdown(markdown: string): string {
  // Ensure consistent newlines
  let formatted = markdown.replace(/\r\n/g, '\n')

  // Ensure proper spacing for headers
  formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2')

  // Ensure proper spacing for list items
  formatted = formatted.replace(/^(\s*[-*+])\s+/gm, '$1 ')

  // Ensure proper spacing after punctuation
  formatted = formatted.replace(/(\w)([,.!?:;])(\w)/g, '$1$2 $3')

  // Remove extra newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  return formatted.trim()
}

export function processMarkdown(markdown: string): string {
  const cleaned = cleanMarkdown(markdown)
  return formatMarkdown(cleaned)
}