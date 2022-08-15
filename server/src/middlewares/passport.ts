import passport from 'passport';
import { RequestHandler } from 'express';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';

// Configs
import { PASSPORT_CONFIG } from '../configs/passport';

// Helpers
import { logger } from '../helpers/logger';
import { createUsernameFromString } from '../helpers/ulti';

// Models
import { User } from '../models/user.model';

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Login Required middleware.
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

const providerLogin = (
  providerName: string, // Provider field name
  profileId: string,
  email: string,
  accessToken: string,
  name: string,
  done: any,
) => {
  User.findOne({
    $or: [
      { [`${providerName}.id`]: profileId },
      { email },
    ],
  }).then(user => {
    if (user) {
      if (user[providerName].id === undefined) {
        user[providerName].id = profileId;
        user[providerName].token = accessToken;
        user[providerName].email = email;
        user.save();
      }

      return done(null, user);
    } else {
      new User({
        [providerName]: {
          id: profileId,
          token: accessToken,
          email,
        },
        email,
        username: createUsernameFromString(email),
        password: createUsernameFromString(email) + 'pwd',
        name,
      }).save()
      .then(createdUser => {
        logger(`Create new user ${providerName} succeed`);
        return done(null, createdUser);
      })
      .catch(createdErr => {
        logger(`Create user ${providerName} error: ${createdErr.message}`);
        throw createdErr;
      });
    }
  }).catch(err => {
    logger(`Login ${providerName} error: ${err.message}`);
    return done(err);
  });
};

// Sign in using Email and Password.
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user: any) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(undefined, false, { message: `Email ${email} not found.` });
    }
    // Condition check activated
    // if (user && !user.activated) {
    //   return done(undefined, false, { message: `In-activated user ${email}.` });
    // }

    user.comparePassword(password, (userErr: Error, isMatch: boolean) => {
      if (userErr) { return done(userErr); }

      if (isMatch) {
        return done(undefined, user);
      }

      return done(undefined, false, { message: 'Invalid email or password.' });
    });
  });
}));

passport.use(new FacebookStrategy({
  clientID: PASSPORT_CONFIG.FB_KEY,
  clientSecret: PASSPORT_CONFIG.FB_SECRET,
  callbackURL: PASSPORT_CONFIG.FB_CALLBACK_URL,
  profileFields: ['id', 'emails', 'name'],
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function() {
    const profileId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.name.givenName + ' ' + profile.name.familyName;

    providerLogin(
      'providerFacebook',
      profileId,
      email,
      'fb-access-token',
      name,
      done,
    );
  });
},
));

passport.use(new GoogleStrategy({
  clientID: PASSPORT_CONFIG.GG_KEY,
  clientSecret: PASSPORT_CONFIG.GG_SECRET,
  callbackURL: PASSPORT_CONFIG.GG_CALLBACK_URL,
}, function(token, tokenSecret, profile, done) {
  process.nextTick(function() {
    const profileId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.name.givenName + ' ' + profile.name.familyName;

    providerLogin(
      'providerGoogle',
      profileId,
      email,
      'gg-access-token',
      name,
      done,
    );
  });
}));

passport.use(new TwitterStrategy({
  consumerKey: PASSPORT_CONFIG.TW_KEY,
  consumerSecret: PASSPORT_CONFIG.TW_SECRET,
  callbackURL: PASSPORT_CONFIG.TW_CALLBACK_URL,
  includeEmail: true,
},
function(token, tokenSecret, profile, done) {
  process.nextTick(function() {
    const profileId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;

    providerLogin(
      'providerTwitter',
      profileId,
      email,
      'tw-access-token',
      name,
      done,
    );
  });
}));
