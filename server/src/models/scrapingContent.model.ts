import mongoose, { Document, Schema } from 'mongoose';

export interface ScrapingContentType extends Document {
  id?: string;
  originalUrl: string;
  title: string;
  slug: string;
  description: string;
  img: string;

  // Schema markup
  isbn: string;
  numberOfPages: number;
  language: string;
  datePublished: string;

  // Foreign key
  userId: string; // Who added this book
  authorName: string;
  categoryIds: string;

  // SEO
  seoTitle: string;
  seoDesc: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const ScrapingContentSchema: Schema = new mongoose.Schema(
  {
    originalUrl: { type: String },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    img: { type: String },
    isbn: { type: String },
    numberOfPages: { type: Number },
    language: { type: String },
    datePublished: { type: String },

    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    categoryIds: { type: String },

    seoTitle: { type: String },
    seoDesc: { type: String },
  },
  { timestamps: true },
);

export const ScrapingContent = mongoose.model<ScrapingContentType>(
  'ScrapingContent',
  ScrapingContentSchema,
);
