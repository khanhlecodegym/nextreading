import { Request, Response } from 'express';

// Routers
export const GetAboutUs = (
  req: Request,
  res: Response,
) => {
  return res.render(
    'client/none-content/about-us',
    {
      title: 'About Us',
      noneContentPage: true,
    },
  );
};

export const GetContact = (
  req: Request,
  res: Response,
) => {
  return res.render(
    'client/none-content/contact',
    {
      title: 'Contact Us',
      noneContentPage: true,
    },
  );
};

export const GetTermsOfService = (
  req: Request,
  res: Response,
) => {
  return res.render(
    'client/none-content/terms-of-service',
    {
      title: 'Terms of Service',
      noneContentPage: true,
    },
  );
};

export const GetPrivacyPolicy = (
  req: Request,
  res: Response,
) => {
  return res.render(
    'client/none-content/privacy-policy',
    {
      title: 'PrivacyPolicy',
      noneContentPage: true,
    },
  );
};
