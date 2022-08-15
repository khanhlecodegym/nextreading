import { RequestHandler } from 'express';

// Models
import { UserType, ACCOUNT_TYPE } from '../models/user.model';

export const isAdminGroup: RequestHandler = (req, res, next) => {
  if (req.user && (req.user as UserType).role <= ACCOUNT_TYPE.ADMIN) {
    return next();
  }

  return res.redirect('/admin');
};

export const isModeratorGroup: RequestHandler = (req, res, next) => {
  if (req.user && (req.user as UserType).role <= ACCOUNT_TYPE.MODERATOR) {
    return next();
  }

  return res.redirect('/');
};

export const isEditorGroup: RequestHandler = (req, res, next) => {
  if (req.user && (req.user as UserType).role <= ACCOUNT_TYPE.EDITOR) {
    return next();
  }

  return res.redirect('/');
};
