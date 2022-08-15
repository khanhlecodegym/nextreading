import fs from 'fs';

// Helpers
import { writeFile } from './file';
import { SITEMAP_DIR } from '../constants/path';
import { BASE_URL } from '../configs';
import { getDayStr } from './ulti';
import { logger } from './logger';

// Models
import { Category } from '../models/category.model';
import { Author } from '../models/author.model';
import { Book } from '../models/book.model';

enum CHANGE_FREQ {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  NEVER = 'never',
}

enum PRIORITY {
  HOMEPAGE = '1.0',
  CATEGORY = '0.8',
  BOOK = '0.7',
}

export enum SITEMAP_FILE_NAME {
  BASE = 'base.xml',
  BOOKS = 'books.xml',
}

export interface SiteMapItem {
  slug: string;
  lastmod: string;
  changefreq: CHANGE_FREQ;
  priority: PRIORITY;
}

const defaultData: SiteMapItem[] = [
  {
    slug: '',
    lastmod: '2020-11-02',
    changefreq: CHANGE_FREQ.WEEKLY,
    priority: PRIORITY.HOMEPAGE,
  },
];

const generateSitemapItem = ({ slug, lastmod, changefreq, priority }: SiteMapItem) => {
  let sitemapItem = `<url><loc>${BASE_URL}/${slug}</loc>`;
  sitemapItem += `<lastmod>${lastmod}</lastmod>`;
  sitemapItem += `<changefreq>${changefreq}</changefreq>`;
  sitemapItem += `<priority>${priority}</priority></url>`;

  return sitemapItem;
};

// This is sitemap index file
const createSiteMapIndexFile = () => {
  const BASE_SITEMAP_INDEX = [
    SITEMAP_FILE_NAME.BASE,
    SITEMAP_FILE_NAME.BOOKS,
  ];

  let content = '';
  content += '<?xml version="1.0" encoding="UTF-8"?>';
  content += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  content += `${BASE_SITEMAP_INDEX.map(it =>
    `<sitemap><loc>${BASE_URL}/${it}</loc></sitemap>`,
  ).join('')}`;
  content += '</sitemapindex>';

  return content;
};

const createSiteMapFile = (items: SiteMapItem[]) => {
  let content = '';
  content += '<?xml version="1.0" encoding="UTF-8"?>';
  content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  content += `${items.map(it => generateSitemapItem(it)).join('')}`;
  content += '</urlset>';

  return content;
};

export const createSitemapItem = (
  slug: string,
  lastmod: string,
  isBook: boolean = true,
) => {
  let changefreq = CHANGE_FREQ.MONTHLY;
  let priority = PRIORITY.CATEGORY;

  if (isBook) {
    changefreq = CHANGE_FREQ.WEEKLY;
    priority = PRIORITY.BOOK;
  }

  return generateSitemapItem({ slug, lastmod, changefreq, priority });
};

export const insertSiteMapItem = (item: string, fileName: SITEMAP_FILE_NAME) => {
  const filePath = SITEMAP_DIR + fileName;

  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      logger('Read file error: ' + err.message);
    }

    const closeTag = '</urlset>';
    const content = data.split(closeTag);

    // Insert item to end of file before closing tag
    const newContent = [
      content[0],
      item,
      [closeTag],
    ].join('');
    writeFile(SITEMAP_DIR, fileName, newContent);
  });
};

// Reading file then do trick to remove item instead of casting to xml format then finding node
export const removeSiteMapItem = (slug: string, fileName: SITEMAP_FILE_NAME) => {
  const filePath = SITEMAP_DIR + fileName;
  const locUrl = `${BASE_URL}/${slug}`;

  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      logger('Read file error :' + err.message);
    }

    if (data.indexOf(locUrl) < 0) {
      return;
    }

    const prevOpenTag = '<url><loc>';
    const nextCloseTag = '</url>';
    const content = data.split(locUrl);

    const nextCloseTagIdx = content[1].indexOf(nextCloseTag);
    const prevItems = content[0].slice(0, -prevOpenTag.length);
    const nextItems = content[1].substr(nextCloseTagIdx + nextCloseTag.length, content[1].length);

    const newContent = [prevItems, nextItems].join('');
    writeFile(SITEMAP_DIR, fileName, newContent);
  });
};

export const generateSitemap = () => {
  // Base Items is HomePage and Category pages
  const getBaseItems = () =>
    Promise.all([
      Category.find().select('slug updatedAt').exec(),
      Author.find().select('slug updatedAt').exec(),
    ])
    .then(data => {
      const categories: SiteMapItem[] = data[0].map(it => ({
        slug: `category/${it.slug}`,
        lastmod: getDayStr(it.updatedAt),
        changefreq: CHANGE_FREQ.WEEKLY,
        priority: PRIORITY.CATEGORY,
      }));

      const authors: SiteMapItem[] = data[1].map(it => ({
        slug: `author/${it.slug}`,
        lastmod: getDayStr(it.updatedAt),
        changefreq: CHANGE_FREQ.WEEKLY,
        priority: PRIORITY.CATEGORY,
      }));

      return [...defaultData, ...categories, ...authors];
    });

  const getBookItems = () => Book.find({ verified: true })
    .select('slug updatedAt')
    .sort('-updatedAt')
    .exec()
    .then(books => {
      return books.map(it => ({
        slug: it.slug,
        lastmod: getDayStr(it.updatedAt),
        changefreq: CHANGE_FREQ.WEEKLY,
        priority: PRIORITY.BOOK,
      })) as SiteMapItem[];
    });

  return Promise.all([
      getBaseItems(),
      getBookItems(),
    ]).then(data => {
      const indexSitemap = createSiteMapIndexFile();
      const baseSitemap = createSiteMapFile(data[0]);
      const bookSitemap = createSiteMapFile(data[1]);

      return Promise.all([
        writeFile(SITEMAP_DIR, 'sitemap.xml', indexSitemap),
        writeFile(SITEMAP_DIR, SITEMAP_FILE_NAME.BASE, baseSitemap),
        writeFile(SITEMAP_DIR, SITEMAP_FILE_NAME.BOOKS, bookSitemap),
      ]);
    });
};

// Generate Books sitemap
export const generateBooksSitemap = () => {
  return Book.find({ verified: true })
    .select('slug updatedAt')
    .sort('-updatedAt')
    .exec()
    .then(books => {
      const sitemapBooks = books.map(it => ({
        slug: `book/${it.slug}`,
        lastmod: getDayStr(it.updatedAt),
        changefreq: CHANGE_FREQ.WEEKLY,
        priority: PRIORITY.BOOK,
      })) as SiteMapItem[];

      const bookSitemap = createSiteMapFile(sitemapBooks);

      return writeFile(SITEMAP_DIR, SITEMAP_FILE_NAME.BOOKS, bookSitemap);
    });
};
