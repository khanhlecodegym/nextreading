import mongoose, { Document, Schema } from 'mongoose';

export interface ReviewType extends Document {
  id?: string;
  score: number; // Summary up and down votes
  content: string;
  verified: boolean;
  refer: string; // Name: Website, fan page...
  referUrl: string;
  counting: number;

  // Foreign key
  bookId: string;
  userId: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const ReviewSchema: Schema = new mongoose.Schema(
  {
    score: { type: Number, required: true, default: 0 },
    content: { type: String, required: true },
    verified: { type: Boolean, default: false },
    refer: { type: String },
    referUrl: { type: String },

    bookId: { type: Schema.Types.ObjectId, ref: 'Book' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    counting: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ReviewSchema.pre<ReviewType>('save', function(next) {
  const review = this;
  const schemaName = 'Review';

  mongoose.models[schemaName].countDocuments(function(err, totalDocuments) {
    if (err) {
      return next(err);
    }

    review.counting = totalDocuments++;
    return next();
  });
});

export const Review = mongoose.model<ReviewType>('Review', ReviewSchema);
