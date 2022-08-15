import mongoose, { Document, Schema } from 'mongoose';

export enum BADGE_TYPE {
  Bronze,
  Silver,
  Gold,
}

export interface BadgeType extends Document {
  id?: string;
  type: BADGE_TYPE;
  name: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const BadgeSchema: Schema = new mongoose.Schema(
  {
    type: { type: Number },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export const Badge = mongoose.model<BadgeType>('Badge', BadgeSchema);
