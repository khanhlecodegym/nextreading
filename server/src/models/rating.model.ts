import mongoose, { Document, Schema } from 'mongoose';

// Helpers
import { getDayStr, getNextDay } from '../helpers/ulti';

export interface RatingType extends Document {
  id?: string;
  value: number;
  startDate: string;
  finishDate: string;
  // TODO: Re-read: boolean

  // Foreign key
  bookId: string;
  userId: string;
}

const RatingSchema: Schema = new mongoose.Schema(
  {
    // 0 value mean user didn't rating yet, in current reading list
    value: { type: Number, required: true, min: 0, max: 5, default: 0 },
    startDate: { type: String, default: getNextDay(-7) },
    finishDate: { type: String },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
);

export const Rating = mongoose.model<RatingType>('Rating', RatingSchema);
