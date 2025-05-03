const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function viewNotes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Note = mongoose.model('Note', new mongoose.Schema({
      userId: String,
      title: String,
      canvasData: String,
      createdAt: Date,
      updatedAt: Date
    }));

    const notes = await Note.find({}).sort({ createdAt: -1 });
    
    console.log('\nFound Notes:');
    notes.forEach((note, index) => {
      console.log(`\nNote ${index + 1}:`);
      console.log(`Title: ${note.title}`);
      console.log(`User ID: ${note.userId}`);
      console.log(`Created: ${note.createdAt}`);
      console.log(`Updated: ${note.updatedAt}`);
      console.log('---');
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

viewNotes(); 