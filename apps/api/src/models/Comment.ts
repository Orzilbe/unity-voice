// apps/api/src/models/Comment.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Comment as CommentType } from '@unity-voice/types';

export interface IComment extends Document {
  commentId: string;
  commentContent: string;
  feedback?: string;
  postId: string;
}

const CommentSchema: Schema = new Schema({
  commentId: { type: String, required: true, unique: true },
  commentContent: { type: String, required: true },
  feedback: { type: String },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true }
});

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;