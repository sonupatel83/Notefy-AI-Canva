import CanvasEditor from "@/components/canvas-editor"
import { auth } from "@clerk/nextjs/server"
import { Note } from "@/models/note"
import { connectToDatabase } from "@/lib/db"
import { redirect } from "next/navigation"

async function getNote(id: string, userId: string) {
  if (id === "new") return null

  await connectToDatabase()
  const note = await Note.findOne({ _id: id, userId })

  if (!note) return null
  return JSON.parse(JSON.stringify(note))
}

export default async function CanvasPage({ params }: { params: { id: string } }) {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const note = await getNote(params.id, userId)

  // If trying to access a note that doesn't exist or doesn't belong to the user
  if (params.id !== "new" && !note) {
    redirect("/dashboard")
  }

  return <CanvasEditor noteId={params.id} initialNote={note} userId={userId} />
}
