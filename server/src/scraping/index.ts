import scrapeIt from 'scrape-it';

// Constants
import {
  domainSnippets,
  GLOBAL_REGEX_CONTENT,
} from './constants';

// Helpers
import { logger } from '../helpers/logger';
import { convertToSlug } from '../helpers/ulti';

// Models
import { Author } from '../models/author.model';

// Types
import { BookScraping, AuthorScraping } from './types';

export const scrapingAuthor = (authorUrl: string) => {
  const domainSnippet = domainSnippets.find(it => authorUrl.includes(it.domain));

  if (!domainSnippet) {
    return Promise.reject(new Error('Can not detect scraping domain!!!'));
  }

  return scrapeIt(authorUrl, domainSnippet.authorSnip)
    .then(({ data, response }) => {
      const {
        name,
        description,
        descriptionFull,
        ...rest
      } = data as AuthorScraping;

      let formatContent = JSON.stringify(descriptionFull || description);

      GLOBAL_REGEX_CONTENT.forEach(it => {
        formatContent = formatContent.replace(it.searchValue, it.replaceValue);
      });

      formatContent = JSON.parse(formatContent.trim());

      return {
        ...rest,
        name,
        slug: convertToSlug(name),
        description: formatContent,
      };
    })
    .catch(err => {
      logger('Scraping author error: ' + authorUrl);
      logger('error: ' + err);
      throw new Error(err.message);
    });
};

export const scrapingBook = (bookUrl: string) => {
  const domainSnippet = domainSnippets.find(it => bookUrl.includes(it.domain));

  if (!domainSnippet) {
    return Promise.reject(new Error('Can not detect scraping domain!!!'));
  }

  return scrapeIt(bookUrl, domainSnippet.bookSnip)
    .then(({ data, response }) => {
      const {
        title,
        description,
        descriptionFull,
        authorName,
        ...rest
      } = data as BookScraping;

      let formatContent = JSON.stringify(descriptionFull || description);

      GLOBAL_REGEX_CONTENT.forEach(it => {
        formatContent = formatContent.replace(it.searchValue, it.replaceValue);
      });

      formatContent = JSON.parse(formatContent.trim());

      return Author.findOne({ slug: convertToSlug(authorName) })
        .select('id')
        .then(author => ({
            ...rest,
            title,
            slug: convertToSlug(title),
            description: formatContent,
            authorName,
            authorId: author ? author._id : undefined,
          }));
    })
    .catch(err => {
      logger('Scraping book error: ' + bookUrl);
      logger('error: ' + err);
      throw new Error(err.message);
    });
};
