// Helpers
import { convertToSlug } from './ulti';

const exportAccountUsername = (account: string = '') => {
  let accountName = '';
  const domainSplit = '.com/';
  const mentionSplit = '@';

  if (!account.trim()) {
    return '';
  }

  if (account.includes(domainSplit)) {
    accountName = account.split(domainSplit)[1] || '';
  }

  if (account.includes(mentionSplit)) {
    accountName = account.split(mentionSplit)[1] || '';
  }

  return accountName.replace('/', '');
};

export const formatCommonModel = (reqBody: any) => {
  const {
    name = '',
    title = '',
    // Category
    isFiction,
    // User,
    role,
    instagram,
    twitter,
    ...rest
  } = reqBody;

  const basicDocument = {
    ...rest,
    name: name.trim(),
    title: title.trim(),
    slug: convertToSlug(title || name),
    isFiction: !!Number(isFiction),
    role: Number(role),
    instagram: exportAccountUsername(instagram),
    twitter: exportAccountUsername(twitter),
  };

  // Remove undefined fields
  return JSON.parse(JSON.stringify(basicDocument));
};

export const formatBookModel = (reqBody: any) => {
  const {
    name,
    published,
    ...rest
  } = reqBody;

  const bookDocument = {
    ...rest,
    published: !!Number(published),
  };

  return JSON.parse(JSON.stringify(bookDocument));
};

const CONTENT_REGEX = [
  /* Allow multiple break line from user content
  // Auto adding break line
  {
    searchValue: /(<\/p>)+/g,
    replaceValue: '</p><br>',
  },
  {
    searchValue: /(<\/blockquote>)+/g,
    replaceValue: '</blockquote><br>',
  },
  {
    searchValue: /(<\/ol>)+/g,
    replaceValue: '</ol><br>',
  },
  {
    searchValue: /(<\/ul>)+/g,
    replaceValue: '</ul><br>',
  },
  // Remove multiple break line
  {
    searchValue: /(<p><br[^>]*>+<\/p>)+/g,
    replaceValue: '<br>',
  },
  {
    searchValue: /(<br[^>]*>)+/g,
    replaceValue: '<br>',
  },
  */
];

export const formatReviewModel = (reqBody: any) => {
  const {
    name,
    verified,
    content = '',
    score,
    ...rest
  } = reqBody;

  let formatContent = JSON.stringify(content);

  CONTENT_REGEX.forEach(it => {
    formatContent = formatContent.replace(it.searchValue, it.replaceValue);
  });

  formatContent = JSON.parse(formatContent.trim());

  const reviewDocument = {
    ...rest,
    content: formatContent,
    score: Number(score || 0),
    verified: !!Number(verified),
  };

  return JSON.parse(JSON.stringify(reviewDocument));
};
