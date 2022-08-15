
// Models
import { FlashMessage } from '../models/message.model';

/**
 * Convert Vietnamese to slug
 * Refer: https://freetuts.net/tao-slug-tu-dong-bang-javascript-va-php-199.html
 * @param text
 */
export const convertToSlug = (text: string) =>
  text.toLowerCase()
    .normalize('NFD')
    // Vietnamese characters
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    // Special symbol
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

export const createUsernameFromString = (text: string) => {
  return text.split('@')[0].replace(/[^\w-]+/g, '').trim();
};

// Prepare flash message
export const getFlashMessage = ({
  error,
  success,
  message,
}: FlashMessage) =>
  JSON.parse(JSON.stringify({
    error: Boolean(error),
    success: Boolean(success),
    message,
  }));

export const getDayStr = (date?: string) => {
  if (date) {
    return new Date(date).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
};

// Get today or next few days
export const getNextDay = (nextDay: number = 0) => {
  const today = new Date();
  let nextDate = new Date();

  if (nextDay !== 0) {
    nextDate = new Date(today.setDate(today.getDate() + nextDay));
  }

  return nextDate.toISOString().slice(0, 10);
};

export const isEmptyObj = (obj: object) => {
  let isEmpty = true;

  if (Object.keys(obj).length === 0 && obj.constructor === Object) {
    return true;
  }

  Object.keys(obj).forEach((key: string) => {
    if (isEmpty && !!obj[key]) {
      isEmpty = false;
    }
  });

  return isEmpty;
};

export const getTextOnly = (content: string) => {
  return content.replace(/<[^>]+>/g, '');
};
