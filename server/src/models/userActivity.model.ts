import mongoose, { Document, Schema } from 'mongoose';

import { ENTITY } from '../constants/entity';

export interface UserActivityType extends Document {
  id?: string;
  entity: ENTITY;
  activity: string;
  score: number;

  // Foreign key
  referId: string;
  userId: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const UserActivitySchema: Schema = new mongoose.Schema(
  {
    entity: { type: String },
    activity: { type: String, required: true },
    score: { type: Number, default: 1 },
    referId: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const UserActivity = mongoose.model<UserActivityType>('UserActivity', UserActivitySchema);
