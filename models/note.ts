import mongoose from "mongoose"

const SlideSchema = new mongoose.Schema({
  canvasData: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
})

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: "Untitled Note",
  },
  slides: [SlideSchema],
}, {
  timestamps: true,
})

// Delete the existing model if it exists
delete mongoose.models.Note

// Create a new model
const Note = mongoose.model("Note", NoteSchema)
export { Note }
