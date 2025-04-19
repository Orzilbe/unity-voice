// apps/api/src/models/Post.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Post as PostType } from '@unity-voice/types';

export interface IPost extends Document {
  postId: string;
  postContent: string;
  picture?: string;
  taskId: string;
}

const PostSchema: Schema = new Schema({
  postId: { type: String, required: true, unique: true },
  postContent: { type: String, required: true },
  picture: { type: String },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true }
});

const Post = mongoose.model<IPost>('Post', PostSchema);

export default Post;