import strip from "strip-markdown"
import remarkGfm from "remark-gfm"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(strip, {
    keep: ["heading", "list", "listItem", "strong", "emphasis", "link", "blockquote", "code", "inlineCode"],
  })
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    strong: "**",
    listItemIndent: "one",
    rule: "-",
  })

export function cleanMarkdown(markdown: string): string {
  // Remove any HTML tags
  const withoutHtml = markdown.replace(/<[^>]*>/g, "")

  // Process with remark to standardize markdown
  const processed = processor.processSync(withoutHtml)

  return processed.toString()
}

export function formatMarkdown(markdown: string): string {
  // Ensure consistent newlines
  let formatted = markdown.replace(/\r\n/g, "\n")

  // Ensure proper spacing for headers
  formatted = formatted.replace(/^(#{1,6})(\S)/gm, "$1 $2")

  // Ensure proper spacing for list items
  formatted = formatted.replace(/^(\s*[-*+])(\S)/gm, "$1 $2")

  // Ensure proper spacing after punctuation
  formatted = formatted.replace(/(\S)([,.!?:;])(\S)/g, "$1$2 $3")

  // Remove extra newlines while preserving intentional line breaks
  formatted = formatted.replace(/\n{3,}/g, "\n\n")

  // Ensure consistent list item markers
  formatted = formatted.replace(/^(\s*)[*+](\s)/gm, "$1-$2")

  return formatted.trim()
}

export function processMarkdown(markdown: string): string {
  const cleaned = cleanMarkdown(markdown)
  return formatMarkdown(cleaned)
}

