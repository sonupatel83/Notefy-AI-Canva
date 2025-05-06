"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"

interface NoteCardProps {
  note: {
    _id: string
    title: string
    slides: Array<{
      canvasData: string
      order: number
    }>
    updatedAt: string
  }
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/notes/${note._id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      onDelete(note._id)
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600], // Standard canvas size
      })

      // Add all slides to the PDF
      note.slides.forEach((slide, index) => {
        if (index > 0) {
          pdf.addPage()
        }
        const img = new Image()
        img.src = slide.canvasData
        pdf.addImage(img, "PNG", 0, 0, 800, 600)
      })

      pdf.save(`${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`)
    } catch (error) {
      console.error("Error downloading note:", error)
      toast({
        title: "Error",
        description: "Failed to download note. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="h-32 bg-gray-100 flex items-center justify-center p-3">
        {note.slides[0]?.canvasData ? (
          <img
            src={note.slides[0].canvasData}
            alt="Note preview"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-gray-400">Note Preview</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium mb-1 text-sm">{note.title}</h3>
        <div className="mt-auto pt-1">
          <div className="text-xs text-gray-500 mb-1">
            Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-7"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 