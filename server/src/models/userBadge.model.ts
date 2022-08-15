import mongoose, { Document, Schema } from 'mongoose';

export interface UserBadgeType extends Document {
  id?: string;
  repeat: number;

  // Foreign key
  badgeId: string;
  userId: string;

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const UserBadgeSchema: Schema = new mongoose.Schema(
  {
    repeat: { type: Number },
    badgeId: { type: Schema.Types.ObjectId, ref: 'Badge' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const UserBadge = mongoose.model<UserBadgeType>('UserBadge', UserBadgeSchema);
