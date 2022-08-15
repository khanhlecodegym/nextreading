import { Router } from 'express';

// Model
import { CategoryType, Category } from '../../../models/category.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';
import { Affiliate } from '../../../models/affiliate.model';
import { Book, BookType } from '../../../models/book.model';

// Constants
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { formatCommonModel } from '../../../helpers/format';
import {
  isEmptyObj,
  getFlashMessage,
  convertToSlug,
} from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

const inputFields = [
  'amazon',
  'fahasa',
  'vinabook',
  'shopee',
  'lazada',
  'tiki',
];

export const affiliateRouter = Router()
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
      { name: 'Book Name', field: 'name' },
      { name: 'Amazon', field: 'amazon', status: true },
      { name: 'Fahasa', field: 'fahasa', status: true },
      { name: 'Vinabook', field: 'vinabook', status: true },
      { name: 'Shopee', field: 'shopee', status: true },
      { name: 'Lazada', field: 'lazada', status: true },
      { name: 'Tiki', field: 'tiki', status: true },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return Book.findOne(formatQuery)
      .then(book => {
        const affQuery = !isEmptyObj(formatQuery) && book.id
          ? { bookId: book.id }
          : {};

        return Affiliate.find(affQuery)
          .limit(DEFAULT_QUERY_LIMIT)
          .skip(DEFAULT_QUERY_LIMIT * (page - 1))
          .populate({ path: 'bookId', select: 'title' })
          .exec()
          .then(data => {
            const formatData = data
              .filter(it => it.bookId)
              .map(it => ({
                id: it.id,
                amazon: it.amazon,
                fahasa: it.fahasa,
                vinabook: it.vinabook,
                shopee: it.shopee,
                lazada: it.lazada,
                tiki: it.vinabook,
                name: (it.bookId as any as BookType).title,
              }));

            return res.render(
              'admin/common/listing',
              {
                title: 'Affiliate Listing Page',
                entity: ENTITY.AFFILIATE,
                query,
                page: Number(page),
                data: formatData,
                headers,
                ...flashMessage,
              },
            );
          });
      });
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Affiliate
      .findById(id)
      .populate({ path: 'bookId', select: 'id title' })
      .exec()
      .then(data => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Affiliate ID!!!`);

          return res.redirect(`/admin/${ENTITY.AFFILIATE}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/affiliate/update',
          {
            title: `Affiliate Detail: ${data.id}`,
            data,
            bookId: (data.bookId as any as BookType).id,
            bookName: (data.bookId as any as BookType).title,
            inputFields,
            entity: ENTITY.AFFILIATE,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Affiliate ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.AFFILIATE}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const affiliateId = req.body.id;

    return Affiliate.findByIdAndUpdate(affiliateId, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated affliate id: ${affiliateId}.`);

        return res.redirect(`/admin/${ENTITY.AFFILIATE}/${affiliateId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating affliate id: ${affiliateId} error!!!`);

        return res.redirect(`/admin/${ENTITY.AFFILIATE}/${affiliateId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return Affiliate.findById(id)
      .then(affiliate => {
        const message = encodeURIComponent(`Successfully deleted affiliate id: ${id}.`);

        affiliate.remove().then(() =>
          res.redirect(`/admin/${ENTITY.AFFILIATE}/?success=true&message=${message}`));
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing affiliate error!!!`);

        return res.redirect(`/admin/${ENTITY.AFFILIATE}/?error=true&message=${message}`);
      });
  });
