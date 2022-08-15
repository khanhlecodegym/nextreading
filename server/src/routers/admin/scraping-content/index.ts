import { Router } from 'express';

// Model
import { Author } from '../../../models/author.model';
import { ScrapingContent } from '../../../models/scrapingContent.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';

// Constants
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

// Router
import { createNewBook } from '../book';

export const scrapingContentRouter = Router()
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
      { name: 'Title', field: 'title' },
      { name: 'Url', field: 'originalUrl' },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return ScrapingContent.find(formatQuery)
      .sort({ createdAt: 1 })
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .limit(DEFAULT_QUERY_LIMIT)
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: 'Scraping Content Listing',
            entity: ENTITY.SCRAPING_CONTENT,
            query,
            page: Number(page),
            data,
            headers,
            ...flashMessage,
          },
        ),
      );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return ScrapingContent.findById(id).exec()
      .then(data => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Scraping Book Content ID!!!`);

          return res.redirect(`/admin/${ENTITY.SCRAPING_CONTENT}/?error=true&message=${message}`);
        }

        return Author
          .findOne({ slug: convertToSlug(data.authorName) })
          .then(author => {
            return res.render(
              `admin/${ENTITY.BOOK}/update`,
              {
                title: `Scraping Content Detail: ${data.id}`,
                data,
                authorId: author ? author.id : '',
                affiliate: {},
                entity: ENTITY.SCRAPING_CONTENT,
                ...flashMessage,
              },
            );
          });
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Scraping Book Content ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.SCRAPING_CONTENT}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const { id, userId } = req.body;
    const newBookData = {
      ...req.body,
      verified: false,
    };

    return createNewBook(newBookData, userId)
      .then(newBookId => {
        return ScrapingContent
          .findByIdAndRemove(id)
          .exec()
          .then(() => {
            const message = encodeURIComponent('Successfully convert Scraping Book Content');
            return res.redirect(`/admin/${ENTITY.BOOK}/${newBookId}?success=true&message=${message}`);
          });
      }).catch(err => {
        logger('Convert error: ' + err.message);
        const message = encodeURIComponent(`Converting Scraping Book Content id: ${id} error!!!`);
        return res.redirect(`/admin/${ENTITY.SCRAPING_CONTENT}/${id}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return ScrapingContent.findById(id)
      .then(data => {
        const message = encodeURIComponent(`Successfully deleted Scraping Content id: ${id}.`);

        data.remove().then(() =>
          res.redirect(`/admin/${ENTITY.SCRAPING_CONTENT}/?success=true&message=${message}`));
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing Scraping Content error!!!`);

        return res.redirect(`/admin/${ENTITY.SCRAPING_CONTENT}/?error=true&message=${message}`);
      });
  });
