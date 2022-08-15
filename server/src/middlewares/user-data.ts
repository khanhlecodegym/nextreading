import { RequestHandler } from 'express';

export const passingUserData: RequestHandler = (
  req,
  res,
  next,
) => {
  if (req.user) {
    res.locals.user = req.user;
  } else {
    res.locals.user = {};
  }

  return next();
};
