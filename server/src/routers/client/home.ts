import { Request, Response } from 'express';

// Helpers
import { getUserSettings } from './_helpers';

export const HomeController = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  return res.render(
    isAMP ? 'client/amp/index' : 'client/index',
    {
      title: 'Homepage',
      isHomePage: true,
      setting: getUserSettings(req),
    },
  );
};
