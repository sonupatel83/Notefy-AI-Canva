"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import ReactMarkdown from "react-markdown"
import "katex/dist/katex.min.css"

interface AIResponseDisplayProps {
  content: string
}

export default function AIResponseDisplay({ content }: AIResponseDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // Scroll to the top of the response when it changes
      containerRef.current.scrollTop = 0
    }
  }, [content])

  return (
    <div ref={containerRef} className="overflow-y-auto">
      <Card className="p-4">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
            p: ({ node, ...props }) => <p className="my-2" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
            li: ({ node, ...props }) => <li className="my-1" {...props} />,
            code: ({ inline, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string }) =>
              inline ? (
                <code className="bg-gray-100 px-1 rounded" {...props} />
              ) : (
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto my-2">
                  <code {...props} />
                </pre>
              ),
            img: ({ node, ...props }) => (
              <img className="max-w-full h-auto my-4 rounded" {...props} alt={props.alt || "AI generated image"} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
            td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
            a: ({ node, ...props }) => (
              <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
            em: ({ node, ...props }) => <em className="italic" {...props} />,
            hr: ({ node, ...props }) => <hr className="my-4 border-t border-gray-300" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </Card>
    </div>
  )
}

