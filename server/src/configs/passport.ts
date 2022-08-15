import session from 'express-session';
import mongo from 'connect-mongo';

import {
  BASE_URL,
  DATABASE_URL,
  PASS_PORT_SECRET_KEY,
  FB_KEY,
  FB_SECRET,
  GG_KEY,
  GG_SECRET,
  TW_KEY,
  TW_SECRET,
} from './envVars';

const MongoStore = mongo(session);

export const passportSession = session({
  resave: true,
  saveUninitialized: true,
  secret: PASS_PORT_SECRET_KEY,
  store: new MongoStore({
    url: DATABASE_URL,
    autoReconnect: true,
  }),
});

export const PASSPORT_CONFIG = {
  FB_KEY,
  FB_SECRET,
  FB_CALLBACK_URL: `${BASE_URL}/auth/facebook/callback`,
  GG_KEY,
  GG_SECRET,
  GG_CALLBACK_URL: `${BASE_URL}/auth/google/callback`,
  TW_KEY,
  TW_SECRET,
  TW_CALLBACK_URL: `${BASE_URL}/auth/twitter/callback`,
};
