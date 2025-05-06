"use client"

import { useState, useEffect } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardHeader from "@/components/dashboard-header"
import NoteCard from "@/components/note-card"
import { toast } from "@/hooks/use-toast"

interface Note {
  _id: string
  title: string
  // Add other note properties as needed
}

async function getNotes(userId: string) {
  try {
    const response = await fetch("/api/notes")
    if (!response.ok) {
      throw new Error("Failed to fetch notes")
    }
    return await response.json()
  } catch (error) {
    console.error("Error in getNotes:", error)
    return []
  }
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFileLoading, setIsFileLoading] = useState(false)

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes")
      if (!response.ok) {
        throw new Error("Failed to fetch notes")
      }
      const data = await response.json()
      setNotes(data)
      setFilteredNotes(data)
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredNotes(notes)
      return
    }

    const searchQuery = query.toLowerCase()
    const filtered = notes.filter((note: any) => 
      note.title.toLowerCase().includes(searchQuery)
    )
    setFilteredNotes(filtered)
  }

  const handleDelete = (id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id))
    setFilteredNotes((prevNotes) => prevNotes.filter((note) => note._id !== id))
  }

  const handleFileClick = (e: React.MouseEvent) => {
    // Only show loading for opening the file, not for download or delete
    const target = e.target as HTMLElement;
    const isActionButton = target.closest('button');
    if (!isActionButton) {
      setIsFileLoading(true);
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader onSearch={handleSearch} />

      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Notes</h1>
          <Link href="/canvas/new">
            <Button>Create New Note</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-4">
              {notes.length === 0 ? "You don't have any notes yet" : "No notes found"}
            </h2>
            <p className="text-gray-500 mb-6">
              {notes.length === 0 
                ? "Create your first note to get started with Notefy."
                : "Try adjusting your search query."}
            </p>
            {notes.length === 0 && (
              <Link href="/canvas/new">
                <Button>Create Your First Note</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note: any) => (
              <div key={note._id} className="group">
                <Link href={`/canvas/${note._id}`} className="block" onClick={handleFileClick}>
                  <NoteCard note={note} onDelete={handleDelete} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Loading Popup */}
        {isFileLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
              <p className="text-lg font-medium">Loading the file...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
