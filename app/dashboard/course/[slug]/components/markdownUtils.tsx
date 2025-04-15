import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      className="prose lg:prose-xl dark:prose-invert max-w-none"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-relaxed text-base">{children}</p>,
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold mb-3 mt-6 text-primary border-b border-primary pb-2">
            {children}
          </h3>
        ),
        ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
        li: ({ children }) => {
          if (
            Array.isArray(children) &&
            children.length > 0 &&
            React.isValidElement(children[0]) &&
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
            <strong className="font-bold text-primary">{children}</strong>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <strong className="font-bold text-primary cursor-help">{children}</strong>
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
            className="text-blue-600 hover:underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
