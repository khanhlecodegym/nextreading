import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import * as path from 'path';

// Constants
import { serverDir } from './constants/path';

// Configs
import {
  ENVIRONMENT,
  PORT,
  BASE_URL,
  SITE_NAME,
  SITE_LOGO,
  SITE_TITLE,
  SITE_DESC,
  SITE_NUMBER_PAGES,
} from './configs';
import { connectDb } from './configs/db';
import { passportSession } from './configs/passport';

// Middlewares
import { isAuthenticated } from './middlewares/passport';
import { passingUserData } from './middlewares/user-data';

// Routers
import { adminRouter } from './routers/admin';
import { clientRouter } from './routers/client';

const app = express();
const viewDir = `${serverDir}/src/views`;

// Global variables
app.locals.BASE_URL = BASE_URL;
app.locals.SITE_NAME = SITE_NAME;
app.locals.SITE_LOGO = SITE_LOGO;
app.locals.SITE_TITLE = SITE_TITLE;
app.locals.SITE_DESC = SITE_DESC;
app.locals.SITE_NUMBER_PAGES = SITE_NUMBER_PAGES;

if (ENVIRONMENT === 'dev') {
  app.locals.pretty = true;
}

// Middlewares
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 40000,
}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['nodeCookieKeySess'],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}));
app.use(bodyParser.json());
// Passport configs
app.use(passportSession);
app.use(passport.initialize());
app.use(passport.session());
app.use(compression());

// Setup template
app.set('views', viewDir);
app.set('view engine', 'pug');

// Static files
app.use('/', express.static(path.join(__dirname, '../static')));

// Routers
app.use('/admin', [passingUserData, isAuthenticated], adminRouter);
app.use('/', passingUserData, clientRouter);

connectDb().then(async () => {
  app.listen(PORT, () => {
    return console.log(`server is listening on ${PORT}`);
  });
});
