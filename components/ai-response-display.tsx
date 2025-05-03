"use client"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface AIResponseDisplayProps {
  content: string
}

export default function AIResponseDisplay({ content }: AIResponseDisplayProps) {
  return (
    <div className={cn(
      "prose prose-sm max-w-none",
      "text-black",
      "prose-headings:font-bold prose-headings:text-black prose-headings:mb-2",
      "prose-p:text-black prose-p:leading-relaxed",
      "prose-a:text-blue-600",
      "prose-code:bg-gray-100 prose-code:text-black prose-code:rounded prose-code:px-1",
      "prose-pre:bg-gray-100 prose-pre:text-black",
      "prose-img:rounded-md",
      "prose-ul:list-disc prose-ul:pl-4",
      "prose-li:text-black prose-li:leading-relaxed"
    )}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
