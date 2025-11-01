import React, { createElement, memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { remark } from "remark"
import html from "remark-html"
// Optional: lightweight highlighting if code fences appear
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"

// Enhanced markdown styles with neo-brutalist theming
const markdownStyles = {
  h1: "text-4xl font-black mt-8 mb-6 pb-3 border-b-4 border-[hsl(var(--border))] uppercase tracking-tight text-[hsl(var(--foreground))]",
  h2: "text-3xl font-black mt-8 mb-5 pb-2 border-b-3 border-[hsl(var(--border))] uppercase tracking-tight text-[hsl(var(--foreground))]",
  h3: "text-2xl font-black mt-6 mb-4 pb-2 border-b-2 border-[hsl(var(--accent))]/50 uppercase tracking-tight text-[hsl(var(--foreground))]",
  h4: "text-xl font-black mt-5 mb-3 uppercase tracking-tight text-[hsl(var(--foreground))]",
  h5: "text-lg font-black mt-4 mb-2 uppercase tracking-tight text-[hsl(var(--foreground))]",
  h6: "text-base font-black mt-3 mb-2 uppercase tracking-tight text-[hsl(var(--foreground))]",
  p: "mb-5 leading-relaxed text-base text-[hsl(var(--foreground))] font-medium",
  a: "text-[hsl(var(--primary))] underline hover:no-underline hover:text-[hsl(var(--primary))]/80 font-bold transition-colors border-b border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))]",
  ul: "mb-6 ml-6 list-none space-y-2",
  ol: "mb-6 ml-6 list-decimal space-y-2 font-bold",
  li: "mb-2 text-[hsl(var(--foreground))] font-medium leading-relaxed pl-2",
  blockquote: "border-l-4 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 pl-6 pr-4 py-4 my-6 italic font-medium text-[hsl(var(--foreground))]/90 shadow-[2px_2px_0px_0px_hsl(var(--warning))]/20",
  hr: "my-8 border-t-3 border-[hsl(var(--border))] border-dashed",
  img: "max-w-full h-auto rounded-none my-6 border-3 border-[hsl(var(--border))] shadow-neo",
  table: "min-w-full divide-y-2 divide-[hsl(var(--border))] my-6 border-3 border-[hsl(var(--border))] shadow-neo",
  th: "px-4 py-3 bg-[hsl(var(--surface))] text-left text-sm font-black uppercase tracking-wider text-[hsl(var(--foreground))] border-r border-[hsl(var(--border))] last:border-r-0",
  td: "px-4 py-3 text-sm text-[hsl(var(--foreground))] font-medium border-r border-[hsl(var(--border))] last:border-r-0",
  pre: "my-6 p-6 bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo overflow-x-auto font-mono text-sm text-[hsl(var(--foreground))] rounded-none",
  code: "bg-[hsl(var(--secondary))] px-2 py-1 rounded-none font-mono text-sm font-bold border border-[hsl(var(--border))]",
  inlineCode: "bg-[hsl(var(--secondary))] px-2 py-1 rounded-none font-mono text-sm font-bold border border-[hsl(var(--border))]",
}

// Enhanced Markdown Components with neo-brutalist styling
const MarkdownComponents = {
  h1: memo(({ children, ...props }: any) => createElement("h1", { ...props, className: markdownStyles.h1 }, children)),
  h2: memo(({ children, ...props }: any) => createElement("h2", { ...props, className: markdownStyles.h2 }, children)),
  h3: memo(({ children, ...props }: any) => createElement("h3", { ...props, className: markdownStyles.h3 }, children)),
  h4: memo(({ children, ...props }: any) => createElement("h4", { ...props, className: markdownStyles.h4 }, children)),
  h5: memo(({ children, ...props }: any) => createElement("h5", { ...props, className: markdownStyles.h5 }, children)),
  h6: memo(({ children, ...props }: any) => createElement("h6", { ...props, className: markdownStyles.h6 }, children)),
  p: memo(({ children, ...props }: any) => createElement("p", { ...props, className: markdownStyles.p }, children)),
  a: memo(({ children, ...props }: any) =>
    createElement(
      "a",
      { ...props, className: markdownStyles.a, target: "_blank", rel: "noopener noreferrer" },
      children,
    ),
  ),
  ul: memo(({ children, ...props }: any) => createElement("ul", { ...props, className: markdownStyles.ul }, children)),
  ol: memo(({ children, ...props }: any) => createElement("ol", { ...props, className: markdownStyles.ol }, children)),
  li: memo(({ children, ...props }: any) => {
    // Enhanced list items with bullet styling
    return createElement("li", { ...props, className: markdownStyles.li }, [
      createElement("span", {
        key: "bullet",
        className: "inline-block w-2 h-2 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] mr-3 mt-2 flex-shrink-0 shadow-[1px_1px_0px_0px_hsl(var(--border))]"
      }),
      children
    ])
  }),
  blockquote: memo(({ children, ...props }: any) =>
    createElement("blockquote", { ...props, className: markdownStyles.blockquote }, [
      createElement("div", {
        key: "quote-icon",
        className: "w-6 h-6 bg-[hsl(var(--warning))] border border-[hsl(var(--border))] flex items-center justify-center mb-2 shadow-[1px_1px_0px_0px_hsl(var(--border))]"
      }, "❝"),
      children
    ]),
  ),
  hr: memo(({ ...props }: any) => createElement("hr", { ...props, className: markdownStyles.hr })),
  img: memo(({ ...props }: any) => createElement("img", { ...props, className: markdownStyles.img, loading: "lazy" })),
  table: memo(({ children, ...props }: any) =>
    createElement("table", { ...props, className: markdownStyles.table }, children),
  ),
  th: memo(({ children, ...props }: any) => createElement("th", { ...props, className: markdownStyles.th }, children)),
  td: memo(({ children, ...props }: any) => createElement("td", { ...props, className: markdownStyles.td }, children)),
  pre: memo(({ children, ...props }: any) =>
    createElement("pre", { ...props, className: markdownStyles.pre }, children),
  ),
  code: memo(({ inline, children, ...props }: any) => {
    if (inline) {
      return createElement("code", { ...props, className: markdownStyles.inlineCode }, children)
    }
    return createElement("code", { ...props, className: "" }, children)
  }),
}

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  // Guard: ensure summary always has a heading for hierarchy
  const safeContent = useMemo(() => {
    if (!content || typeof content !== "string") return content
    const hasHeading = /\n?\s*#+\s+/.test(content)
    if (hasHeading) return content
    return `### Summary\n\n${content}`
  }, [content])

  return (
    <TooltipProvider>
      <ReactMarkdown
        className="prose prose-slate dark:prose-invert max-w-none"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Enhanced list styling with custom bullets
          ul: ({ children }) => <ul className="mb-6 space-y-3">{children}</ul>,
          li: ({ children }) => {
            if (
              Array.isArray(children) &&
              children.length > 0 &&
              React.isValidElement(children[0]) &&
              // @ts-ignore
              children[0].type === "strong"
            ) {
              return (
                <li className="flex items-start gap-3 text-base font-medium leading-relaxed">
                  <div className="w-2 h-2 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] mt-2 flex-shrink-0 shadow-[1px_1px_0px_0px_hsl(var(--border))]" />
                  <div className="flex-1">{children}</div>
                </li>
              )
            }
            return (
              <li className="flex items-start gap-3 text-base font-medium leading-relaxed">
                <div className="w-2 h-2 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] mt-2 flex-shrink-0 shadow-[1px_1px_0px_0px_hsl(var(--border))]" />
                <div className="flex-1">{children}</div>
              </li>
            )
          },

          // Enhanced strong text with tooltips for key concepts
          strong: ({ children }) => {
            const text = String(children).trim()
            const isKeyConcept = text.length > 3 && /\b(key|important|main|essential|crucial|core|fundamental)\b/i.test(text.toLowerCase())

            if (isKeyConcept) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <strong className="font-black text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-1 border border-[hsl(var(--primary))]/30 cursor-help hover:bg-[hsl(var(--primary))]/20 transition-colors">
                      {children}
                    </strong>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-bold">Key Concept</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <strong className="font-black text-[hsl(var(--foreground))] bg-[hsl(var(--warning))]/10 px-2 py-1 border border-[hsl(var(--warning))]/30">
                {children}
              </strong>
            )
          },

          // Enhanced links with better styling
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--primary))] font-bold underline hover:no-underline hover:text-[hsl(var(--primary))]/80 transition-colors border-b-2 border-[hsl(var(--primary))]/30 hover:border-[hsl(var(--primary))] px-1 py-0.5"
            >
              {children}
            </a>
          ),

          // Enhanced code blocks with copy functionality
          pre: ({ children }) => (
            <div className="relative group my-6">
              <pre className="p-6 bg-[hsl(var(--surface))] border-3 border-[hsl(var(--border))] shadow-neo overflow-x-auto font-mono text-sm text-[hsl(var(--foreground))] rounded-none">
                {children}
              </pre>
              <button
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[hsl(var(--secondary))] border-2 border-[hsl(var(--border))] px-2 py-1 text-xs font-bold uppercase hover:bg-[hsl(var(--accent))] hover:shadow-neo-hover"
                onClick={() => {
                  const text = children?.toString() || ''
                  navigator.clipboard.writeText(text)
                }}
              >
                Copy
              </button>
            </div>
          ),

          // Enhanced inline code
          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code className="bg-[hsl(var(--secondary))] px-2 py-1 font-mono text-sm font-bold border-2 border-[hsl(var(--border))] shadow-[1px_1px_0px_0px_hsl(var(--border))]">
                  {children}
                </code>
              )
            }
            return <code {...props}>{children}</code>
          },

          // Enhanced blockquotes with quote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 pl-6 pr-4 py-4 my-6 italic font-medium text-[hsl(var(--foreground))]/90 shadow-[2px_2px_0px_0px_hsl(var(--warning))]/20 relative">
              <div className="absolute -left-2 top-4 w-4 h-4 bg-[hsl(var(--warning))] border-2 border-[hsl(var(--border))] flex items-center justify-center shadow-[1px_1px_0px_0px_hsl(var(--border))]">
                <span className="text-xs font-black text-[hsl(var(--foreground))]">❝</span>
              </div>
              <div className="pl-6">{children}</div>
            </blockquote>
          ),

          // Enhanced headings with better spacing
          h1: ({ children }) => (
            <h1 className="text-4xl font-black mt-8 mb-6 pb-3 border-b-4 border-[hsl(var(--border))] uppercase tracking-tight text-[hsl(var(--foreground))] relative">
              <span className="absolute -left-4 top-0 w-1 h-full bg-[hsl(var(--accent))]" />
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="text-3xl font-black mt-8 mb-5 pb-2 border-b-3 border-[hsl(var(--border))] uppercase tracking-tight text-[hsl(var(--foreground))] relative">
              <span className="absolute -left-3 top-0 w-1 h-full bg-[hsl(var(--warning))]" />
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="text-2xl font-black mt-6 mb-4 pb-2 border-b-2 border-[hsl(var(--accent))]/50 uppercase tracking-tight text-[hsl(var(--foreground))] relative">
              <span className="absolute -left-2 top-0 w-1 h-full bg-[hsl(var(--primary))]" />
              {children}
            </h3>
          ),

          // Enhanced paragraphs
          p: ({ children }) => (
            <p className="mb-5 leading-relaxed text-base text-[hsl(var(--foreground))] font-medium">
              {children}
            </p>
          ),

          // Enhanced tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y-2 divide-[hsl(var(--border))] border-3 border-[hsl(var(--border))] shadow-neo">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="px-4 py-3 bg-[hsl(var(--surface))] text-left text-sm font-black uppercase tracking-wider text-[hsl(var(--foreground))] border-r-2 border-[hsl(var(--border))] last:border-r-0">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))] font-medium border-r border-[hsl(var(--border))] last:border-r-0">
              {children}
            </td>
          ),

          // Enhanced horizontal rules
          hr: () => (
            <hr className="my-8 border-t-3 border-[hsl(var(--border))] border-dashed relative">
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] shadow-[1px_1px_0px_0px_hsl(var(--border))]" />
            </hr>
          ),

          // Enhanced images
          img: ({ src, alt }) => (
            <div className="my-6 text-center">
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto border-3 border-[hsl(var(--border))] shadow-neo rounded-none inline-block"
                loading="lazy"
              />
              {alt && (
                <p className="text-sm font-bold text-[hsl(var(--foreground))]/60 mt-2 italic">
                  {alt}
                </p>
              )}
            </div>
          ),
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </TooltipProvider>
  )
}
const markdownToHtml = async (markdown: any) => {
  const result = await remark().use(html).process(markdown)
  return result.toString()
}
