import mongoose, { Document, Schema } from 'mongoose';

export interface BookType extends Document {
  id?: string;
  title: string;
  slug: string;
  originalId?: string; // In case foreign book, refer to original Id
  description: string;
  img: string;
  views: number;
  verified: boolean;
  totalRating: number[];
  // Schema markup
  isbn: string;
  numberOfPages: number;
  language: string;
  datePublished: string;

  // Foreign key
  userId: string; // Who added this book
  authorId: string;
  categoryIds: [string];

  // SEO
  seoTitle: string;
  seoDesc: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const BookSchema: Schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    originalId: { type: String },
    description: { type: String },
    img: { type: String },
    views: { type: Number, default: 1 },
    verified: { type: Boolean, default: false },
     // https://stackoverflow.com/a/64807037/5456204
    totalRating: { type: [Number], default: [0, 0, 0, 0, 0] },
    isbn: { type: String },
    numberOfPages: { type: Number },
    language: { type: String },
    datePublished: { type: String },

    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorId: { type: Schema.Types.ObjectId, ref: 'Author' },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],

    seoTitle: { type: String },
    seoDesc: { type: String },
  },
  { timestamps: true },
);

export const Book = mongoose.model<BookType>('Book', BookSchema);
