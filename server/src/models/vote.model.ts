import mongoose, { Document, Schema } from 'mongoose';

// Only accept vote up or un-vote, no vote down to avoid toxic behavior
export interface VoteType extends Document {
  id?: string;

  // Foreign key
  reviewId: string;
  userId: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const VoteSchema: Schema = new mongoose.Schema(
  {
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Vote = mongoose.model<VoteType>('Vote', VoteSchema);
