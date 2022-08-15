import { Router } from 'express';

// Model
import { ScrapingContent } from '../../../models/scrapingContent.model';
import { ScrapingUrl } from '../../../models/scrapingUrl.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';

// Constants
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { formatCommonModel, formatBookModel } from '../../../helpers/format';
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';
import { checkDuplicatedSlug } from '../../../helpers/api';
import { scrapingBook } from '../../../scraping';

const scrapingBookContent = (scrapingId, url, userId) => {
  return scrapingBook(url)
    .then(book => {
      return checkDuplicatedSlug(ENTITY.BOOK, book.slug)
        .then(duplicated => {
          if (duplicated) {
            return ScrapingUrl.findByIdAndRemove(scrapingId);
          }

          new ScrapingContent(formatBookModel({
              ...book,
              originalUrl: url,
              userId,
            }))
            .save()
            .then(() => ScrapingUrl.findByIdAndRemove(scrapingId));

          return;
        });
    });
};

export const scrapingUrlRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      query = '',
      page = 1,
    } = req.query as ListingReqQueryPayload;
    const querySlug = convertToSlug(query);
    let formatQuery = {};

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Url', field: 'url', url: true },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return ScrapingUrl.find(formatQuery)
      .sort({ createdAt: 1 })
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .limit(DEFAULT_QUERY_LIMIT)
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: 'Scraping Url Listing',
            entity: ENTITY.SCRAPING_URL,
            query,
            page: Number(page),
            data,
            headers,
            ...flashMessage,
          },
        ),
      );
  })
  .get('/run', (req, res) => {
    return ScrapingUrl.find()
      .sort({ createdAt: 1 })
      .limit(10)
      .then(data => {
        return Promise.all([
          data.forEach(({ id, url, userId }) => {
            return scrapingBookContent(id, url, userId);
          }),
        ]).then(() => {
          const message = encodeURIComponent(`Successfully scraping Book Content Scraping URL.`);

          return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?success=true&message=${message}`);
        }).catch(err => {
          logger('Scraping Book Content error: ' + err.message);
          const message = encodeURIComponent(`Scraping Book Content error!!!`);

          return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
        });
      });
  })
  .get('/submit', (req, res) => {
    return res.render(
      'admin/scraping-url/submit',
      {
        title: 'Submit multiple Scraping URL',
        entity: ENTITY.SCRAPING_URL,
        data: {},
      },
    );
  })
  .post('/submit', (req, res) => {
    const { urls = '', userId } = req.body;
    const listUrls: string[] = urls.replace('\r', '').split('\n');

    return Promise.all([
      listUrls.forEach(url => {
        return new ScrapingUrl({ url, userId }).save();
      }),
    ]).then(() => {
      const message = encodeURIComponent(`Successfully added new ${listUrls.length} Scraping URL.`);

      return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?success=true&message=${message}`);
    }).catch(err => {
      logger('Add new error: ' + err.message);
      const message = encodeURIComponent(`Adding new Scraping URL error!!!`);

      return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
    });
  })
  .get('/create', (req, res) => {
    res.render(
      'admin/scraping-url/update',
      {
        title: 'Create New Scraping URL',
        entity: ENTITY.SCRAPING_URL,
        data: {},
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return ScrapingUrl.findById(id).exec()
      .then(data => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Scraping URL ID!!!`);

          return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/scraping-url/update',
          {
            title: `Scraping URL Detail: ${data.id}`,
            data,
            entity: ENTITY.SCRAPING_URL,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Scraping URL ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new ScrapingUrl(formatCommonModel(req.body)).save()
      .then(data => {
        const message = encodeURIComponent(`Successfully added new Scraping URL id: ${data.id}.`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/${data.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Add new error: ' + err.message);
        const message = encodeURIComponent(`Adding new Scraping URL error!!!`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const { id } = req.body;

    return ScrapingUrl.findByIdAndUpdate(id, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated Scraping URL id: ${id}.`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/${id}/?success=true&message=${message}`);
      }).catch(err => {
        logger('Update error: ' + err.message);
        const message = encodeURIComponent(`Updating Scraping URL id: ${id} error!!!`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/${id}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return ScrapingUrl.findById(id)
      .then(data => {
        const message = encodeURIComponent(`Successfully deleted Scraping URL id: ${id}.`);

        data.remove().then(() =>
          res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?success=true&message=${message}`));
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing Scraping URL error!!!`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_URL}/?error=true&message=${message}`);
      });
  });
