import mongoose, { Schema, Document } from 'mongoose';
import { GENDER } from '../constants/gender';

// ['MALE', 'FEMALE'];
export const ACCOUNT_GENDER_ARRAY =
  Object.values(GENDER).filter(it => isNaN(it as number));

export interface AuthorType extends Document {
  id?: string;
  name: string;
  slug: string;
  img: string;
  dob: string;
  pob: string; // Place of Birth
  website: string;
  description: string;
  gender: GENDER;
  deathDate: string;
  country: string;

  // SEO
  seoTitle: string;
  seoDesc: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const AuthorSchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    img: { type: String },
    dob: { type: String },
    pob: { type: String },
    website: { type: String },
    description: { type: String },
    gender: { type: Number },
    deathDate: { type: String },
    country: { type: String },

    seoTitle: { type: String },
    seoDesc: { type: String },
  },
  { timestamps: true },
);

export const Author = mongoose.model<AuthorType>('Author', AuthorSchema);
