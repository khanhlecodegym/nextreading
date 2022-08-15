import bcrypt from 'bcrypt-nodejs';
import mongoose, { Document, Schema } from 'mongoose';
import { GENDER } from '../constants/gender';

export enum ACCOUNT_TYPE {
  ADMIN,
  MODERATOR,
  EDITOR,
  USER,
}

// ['ADMIN', 'MODERATOR', 'EDITOR', 'USER'];
export const ACCOUNT_TYPE_ARRAY =
  Object.values(ACCOUNT_TYPE).filter(it => isNaN(it as number));

// Username validation
export const USERNAME_MIN_LEN = 6;
export const PASSWORD_MIN_LEN = 6;
export const USERNAME_INVALID = [
  'admin',
  'system',
  'editor',
  'tester',
  'bot',
  'book',
  'author',
  'content',
  'review',
];

type comparePasswordFunction = (
  candidatePassword: string,
  cb: (err: any, isMatch: any) => {},
) => void;

export interface SocialProvider {
  id: string;
  token: string;
  email: string;
}

export interface UserType extends Document {
  id?: string;
  email: string;
  username: string;
  password: string;
  role: ACCOUNT_TYPE;
  name: string;
  img: string;
  score: number; // Reputation
  website: string;
  facebook: string;
  twitter: string; // Username
  instagram: string; // Username
  youtube: string;
  about: string;
  dob: string;
  gender: GENDER;
  country: string;
  comparePassword: comparePasswordFunction;

  // Social provider
  providerFacebook: SocialProvider;
  providerGoogle: SocialProvider;
  providerTwitter: SocialProvider;

  // Reading status
  currentReading: string[];
  wantToRead: string[];

  // Meta data
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    username: {
      type: String,
      unique: true,
      required: true,
      minlength: USERNAME_MIN_LEN,
    },
    password: {
      type: String,
      required: true,
      minlength: PASSWORD_MIN_LEN,
    },
    role: { type: Number, required: true, default: ACCOUNT_TYPE.USER },
    name: { type: String },
    img: { type: String },
    score: { type: Number, default: 0 },
    website: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    youtube: { type: String },
    about: { type: String },
    dob: { type: String },
    gender: { type: Number },
    country: { type: String },
    providerFacebook: { type: Object, default: {} },
    providerGoogle: { type: Object, default: {} },
    providerTwitter: { type: Object, default: {} },
    currentReading: { type: [String], default: [] },
    wantToRead: { type: [String], default: [] },
  },
  { timestamps: true },
);

/**
 * Password hash middleware.
 */
UserSchema.pre<UserType>('save', function(next) {
  const user = this;

  if (!user.isModified('password')) { return next(); }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }

    bcrypt.hash(user.password, salt, undefined, (errHash: mongoose.Error, hash) => {
      if (errHash) { return next(errHash); }
      user.password = hash;
      next();
    });
  });
});

const comparePassword: comparePasswordFunction = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

UserSchema.methods.comparePassword = comparePassword;

export const User = mongoose.model<UserType>('User', UserSchema);
