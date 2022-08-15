import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryType extends Document {
  id?: string;
  name: string;
  vnName: string; // Temporary
  slug: string;
  isFiction: boolean;
  description: string;

  // SEO
  seoTitle: string;
  seoDesc: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const CategorySchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    vnName: { type: String },
    slug: { type: String, required: true, unique: true },
    isFiction: { type: Boolean, default: true },
    description: { type: String },
    seoTitle: { type: String },
    seoDesc: { type: String },
  },
  { timestamps: true },
);

export const Category = mongoose.model<CategoryType>('Category', CategorySchema);
