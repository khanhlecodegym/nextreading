import { Request, Response } from 'express';
import passport from 'passport';
import { IVerifyOptions } from 'passport-local';

// Helpers
import '../../middlewares/passport';
import { logger } from '../../helpers/logger';

// Models
import {
  User,
  UserType,
  USERNAME_MIN_LEN,
  USERNAME_INVALID,
} from '../../models/user.model';

interface AuthenBody {
  email: string;
  username: string;
  password: string;
}

// Middleware helper for Social login
export const mdFacebookGet = passport.authenticate(
  'facebook',
  { scope: 'email' },
);
export const mdFacebookCallback = passport.authenticate(
  'facebook',
  { failureRedirect: '/login' },
);
export const mdGoogleGet = passport.authenticate(
  'google',
  { scope: ['profile', 'email'] },
);
export const mdGoogleCallback = passport.authenticate(
  'google',
  { failureRedirect: '/login' },
);
export const mdTwitterGet = passport.authenticate('twitter');
export const mdTwitterCallback = passport.authenticate(
  'twitter',
  { failureRedirect: '/login' },
);

// Routers
export const GetLogin = (
  req: Request,
  res: Response,
) => {
  const user = req.user as UserType;

  if (user && user.id) {
    return res.redirect('/');
  }

  return res.render(
    'client/none-content/login',
    {
      title: 'Login Page',
      noneContentPage: true,
    },
  );
};

export const PostLogin = (
  req: Request,
  res: Response,
  next,
) => {
  passport.authenticate('local', (err: Error, user: UserType, info: IVerifyOptions) => {
    if (err) { return next(err); }

    if (!user) {
      return res.redirect('/login');
    }

    req.logIn(user, errLogin => {
      if (errLogin) { return next(errLogin); }
      res.redirect('/');
    });
  })(req, res, next);
};

export const GetSignUp = (
  req: Request,
  res: Response,
) => {
  const user = req.user as UserType;

  if (user && user.id) {
    return res.redirect('/');
  }

  return res.render(
    'client/none-content/signup',
    {
      title: 'Signup Page',
      noneContentPage: true,
    },
  );
};

export const PostSignUp = (
  req: Request,
  res: Response,
  next,
) => {
  const { email, username = '', password } = req.body as AuthenBody;
  const user = new User({ email, username: username.toLowerCase(), password });

  if (
    username.length < USERNAME_MIN_LEN ||
    USERNAME_INVALID.indexOf(username.toLowerCase()) !== -1
  ) {
    return res.redirect('/signup');
  }

  User.findOne({ email }, (err, existingUser) => {
    if (err) { return next(err); }

    if (existingUser) {
      return res.redirect('/signup');
    }

    user.save(userErr => {
      if (userErr) {
        logger(`Save user error: ${userErr.message}`);

        return next(userErr);
      }

      res.redirect('/login');

      // Disable auto login for security
      // req.logIn(user, userLoginErr => {
      //   if (userLoginErr) {
      //     return next(userLoginErr);
      //   }
      //   res.redirect('/admin');
      // });
    });
  });
};

export const GetLogout = (
  req: Request,
  res: Response,
) => {
  req.logout();

  res.redirect('/');
};
