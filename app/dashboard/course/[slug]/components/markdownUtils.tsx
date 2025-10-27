import React, { createElement, memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { remark } from "remark"
import html from "remark-html"
// Optional: lightweight highlighting if code fences appear
import rehypeHighlight from "rehype-highlight"

const markdownStyles = {
  h1: "text-3xl font-bold mt-6 mb-4 pb-2 border-b",
  h2: "text-2xl font-bold mt-6 mb-3",
  h3: "text-xl font-bold mt-5 mb-2",
  h4: "text-lg font-bold mt-4 mb-2",
  h5: "text-base font-bold mt-3 mb-1",
  h6: "text-sm font-bold mt-3 mb-1",
  p: "mb-4 leading-relaxed",
  a: "text-primary underline hover:no-underline",
  ul: "mb-4 ml-6 list-disc",
  ol: "mb-4 ml-6 list-decimal",
  li: "mb-1",
  blockquote: "border-l-4 border-muted pl-4 italic my-4",
  hr: "my-6 border-t border-muted",
  img: "max-w-full h-auto rounded-none my-4",
  table: "min-w-full divide-y divide-gray-200 my-4",
  th: "px-3 py-2 bg-muted/50 text-left text-xs font-medium uppercase tracking-wider",
  td: "px-3 py-2 whitespace-normal border-b text-sm",
  pre: "my-4 p-4 bg-slate-900 text-slate-50 overflow-x-auto rounded-none font-mono text-sm",
  code: "bg-secondary px-1.5 py-0.5 rounded-none font-mono text-sm",
  inlineCode: "bg-secondary px-1.5 py-0.5 rounded-none font-mono text-sm",
}

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
  li: memo(({ children, ...props }: any) => createElement("li", { ...props, className: markdownStyles.li }, children)),
  blockquote: memo(({ children, ...props }: any) =>
    createElement("blockquote", { ...props, className: markdownStyles.blockquote }, children),
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
    <ReactMarkdown
      className="prose prose-slate dark:prose-invert max-w-none"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-relaxed text-base">{children}</p>,
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mb-3 mt-6 text-purple-700 dark:text-purple-300 border-b border-purple-300/50 pb-2">
            {children}
          </h3>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
        li: ({ children }) => {
          if (
            Array.isArray(children) &&
            children.length > 0 &&
            React.isValidElement(children[0]) &&
            // @ts-ignore
            children[0].type === "strong"
          ) {
            return (
              <li className="text-base">
                <div className="mt-2">{children}</div>
              </li>
            )
          }
          return <li className="text-base">{children}</li>
        },
        strong: ({ children }) => {
          const text = String(children).trim()
          return text.includes(" ") ? (
            <strong className="font-bold text-purple-700 dark:text-purple-300">{children}</strong>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <strong className="font-bold text-purple-700 dark:text-purple-300 cursor-help">{children}</strong>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Important concept</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline dark:text-purple-400"
          >
            {children}
          </a>
        ),
      }}
    >
      {safeContent}
    </ReactMarkdown>
  )
}
const markdownToHtml = async (markdown: any) => {
  const result = await remark().use(html).process(markdown)
  return result.toString()
}
