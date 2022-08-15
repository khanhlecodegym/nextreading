import mongoose, { Document, Schema } from 'mongoose';

export interface AffiliateType extends Document {
  id?: string;
  fahasa: string;
  vinabook: string;
  tiki: string;
  lazada: string;
  shopee: string;
  amazon: string;

  // Foreign key
  bookId: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const AffiliateSchema: Schema = new mongoose.Schema(
  {
    fahasa: { type: String },
    vinabook: { type: String },
    tiki: { type: String },
    lazada: { type: String },
    shopee: { type: String },
    amazon: { type: String },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  },
  { timestamps: true },
);

export const Affiliate = mongoose.model<AffiliateType>('Affiliate', AffiliateSchema);
