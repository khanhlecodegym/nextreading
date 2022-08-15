import { Request } from 'express';

export const NUMBER_REVIEW_DISPLAY = 3;
export const NUMBER_SUGGESTION_BOOK = 4;
export const PAGINATION_REVIEWS = 10;

// Key is ordering type on client side
// Value is ordering field
export const REVIEW_ORDER_FIELD = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  votes: { score: -1 },
};

const COOKIE_NAME_SETTING = 'userSettings';
enum THEME_MODE {
  DARK = 'dark',
  LIGHT = 'light',
}

const defaultUserSettings = {
  darkMode: false,
};

export const getUserSettings = (req: Request) => {
  const userSettings = req.cookies[COOKIE_NAME_SETTING];

  if (userSettings) {
    return JSON.parse(userSettings);
  }

  return defaultUserSettings;
};
