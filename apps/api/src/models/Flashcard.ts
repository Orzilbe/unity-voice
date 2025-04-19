
// apps/api/src/models/Flashcard.ts
import mongoose from 'mongoose';
export interface IFlashcard extends mongoose.Document {
  word: string;
  translation: string;
  example: string;
  examples?: string[];  // שדה זמני לתאימות אחורית
  topicId: mongoose.Types.ObjectId;
  difficulty?: string;
}

const FlashcardSchema = new mongoose.Schema({
  word: { type: String, required: true },
  translation: { type: String, required: true },
  example: { type: String, default: '' },
  examples: { type: [String], default: [] },  // שמירה על השדה הישן
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  difficulty: { type: String, default: 'intermediate' }
});

// Middleware לסנכרון השדות
FlashcardSchema.pre('save', function(next) {
  // אם יש examples וטרם הוגדר example, קח את הראשון
  if (this.get('examples') && this.get('examples').length > 0 && !this.get('example')) {
    this.set('example', this.get('examples')[0]);
  }
  
  // אם יש example וטרם הוגדר examples, הוסף אותו
  if (this.get('example') && (!this.get('examples') || this.get('examples').length === 0)) {
    this.set('examples', [this.get('example')]);
  }
  
  next();
});

export default mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);