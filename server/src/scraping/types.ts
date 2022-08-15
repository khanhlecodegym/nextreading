import { ScrapeOptions } from 'scrape-it';

export interface RegexReplace {
  searchValue: string | RegExp;
  replaceValue: string;
}

export interface DomainSnippets {
  domain: string;
  bookSnip: ScrapeOptions;
  authorSnip: ScrapeOptions;
  replaceContentRegex?: RegexReplace[];
}

export interface BookScraping {
  title: string;
  authorName: string;
  numberOfPages: number;
  isbn: string;
  language: string;
  img: string;
  description: string;
  descriptionFull: string;
}

export interface AuthorScraping {
  name: string;
  dob: string;
  website: string;
  address: string;
  img: string;
  description: string;
  descriptionFull: string;
}
