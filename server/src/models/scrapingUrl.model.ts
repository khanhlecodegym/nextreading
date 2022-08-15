import mongoose, { Document, Schema } from 'mongoose';

export interface ScrapingUrlType extends Document {
  id?: string;
  url: string;
  // Foreign key
  userId: string; // Who added this scraping url

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const ScrapingUrlSchema: Schema = new mongoose.Schema(
  {
    url: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const ScrapingUrl = mongoose.model<ScrapingUrlType>('ScrapingUrl', ScrapingUrlSchema);
