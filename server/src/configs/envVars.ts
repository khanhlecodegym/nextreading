import dotenv from 'dotenv';

dotenv.config();

export const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
export const PORT = process.env.PORT || 3000;
export const BASE_URL = process.env.BASE_URL;
export const DATABASE_URL = process.env.DATABASE_URL;
export const PASS_PORT_SECRET_KEY = process.env.PASS_PORT_SECRET_KEY;

// AWS S3
export const S3_BUCKET = process.env.S3_BUCKET;
export const S3_KEY = process.env.S3_KEY;
export const S3_SECRET = process.env.S3_SECRET;

// Social provider
export const FB_KEY = process.env.FB_KEY;
export const FB_SECRET = process.env.FB_SECRET;
export const GG_KEY = process.env.GG_KEY;
export const GG_SECRET = process.env.GG_SECRET;
export const TW_KEY = process.env.TW_KEY;
export const TW_SECRET = process.env.TW_SECRET;
