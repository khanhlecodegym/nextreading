import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT, TYPEAHEAD_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { ACTIVITY_TYPE } from '../../../constants/activity';
import {
  getFlashMessage,
  getDayStr,
  convertToSlug,
  isEmptyObj,
} from '../../../helpers/ulti';
import { formatBookModel, formatCommonModel } from '../../../helpers/format';
import {
  SITEMAP_FILE_NAME,
  insertSiteMapItem,
  removeSiteMapItem,
  createSitemapItem,
} from '../../../helpers/sitemap';
import { logger } from '../../../helpers/logger';
import { removeImage } from '../../../helpers/file';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { Book, BookType } from '../../../models/book.model';
import { Author, AuthorType } from '../../../models/author.model';
import { Affiliate } from '../../../models/affiliate.model';
import { UserType } from '../../../models/user.model';

// Router
import { deleteAllRatingByBookId } from '../rating';
import { deleteAllReviewByBookId } from '../review';
import {
  addUserActivityAPI,
  deleteUserActivityAPI,
} from '../user-activity';

export const deleteBook = (id: string) =>
  Book.findById(id)
    .exec()
    .then((bookDoc: BookType) => {
      if (bookDoc.verified) {
        removeSiteMapItem(`book/${bookDoc.slug}`, SITEMAP_FILE_NAME.BOOKS);
      }

      return deleteAllRatingByBookId(id).then(() => {
        return deleteAllReviewByBookId(id).then(() => {
          logger('Deleted review and rating data belong to bookId: ' + id);
          return bookDoc.remove().then(() => removeImage(ENTITY.BOOK, id));
        });
      });
    });

export const getTypeaheadBookAPI = (query: string) => {
  return Book.find({
    slug: new RegExp(convertToSlug(query), 'i'),
  })
    .sort('slug')
    .limit(TYPEAHEAD_QUERY_LIMIT)
    .exec()
    .then((data: BookType[]) => {
      return data.map(({ id, title, slug }) => ({
        name: title, slug, id,
      }));
    });
};

export const createNewBook = (reqBody, userId) => {
  return new Book(formatBookModel({
    ...reqBody,
    userId,
  }))
  .save()
  .then((bookDoc: BookType) => {
    // Add user activity
    addUserActivityAPI(
      ACTIVITY_TYPE.BOOK_ADD_NEW,
      bookDoc.id,
      userId,
    ).then(userActivity => {
      logger('Added user activity ' + userActivity.id);
    });

    // Insert book to sitemap
    if (bookDoc.verified) {
      const sitemapItem = createSitemapItem(`book/${bookDoc.slug}`, getDayStr());
      insertSiteMapItem(sitemapItem, SITEMAP_FILE_NAME.BOOKS);
    }

    return bookDoc.id;
  });
};

export const bookRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const { page = 1, type = '', query = '', ...other} = req.query as ListingReqQueryPayload;
    const querySlug = convertToSlug(query);
    let formatQuery = {};

    if (Object.keys(other).length || query) {
      formatQuery = {
        ...other,
        slug: new RegExp(querySlug, 'i'),
      };
    } else {
      if (type === '') {
        formatQuery = { verified: false };
      } else {
        formatQuery = { verified: true };
      }
    }

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Title', field: 'title' },
      { name: 'Views', field: 'views' },
      { name: 'Verified', field: 'verified', status: true },
      { name: 'Isbn', field: 'isbn', status: true },
      { name: 'Image', field: 'img', status: true },
      { name: 'Operator', field: '_' },
    ];

    return Book.find(formatQuery)
      .sort({ views: -1, slug: 1 })
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: `Danh Sách Sách ${type ? 'Đã' : 'Chưa'} Publish`,
            entity: ENTITY.BOOK,
            query,
            type,
            page: Number(page),
            data,
            headers,
            ...flashMessage,
          },
        ),
      );
  })
  .get('/create', (req, res) => {
    const { authorId } = req.query as ListingReqQueryPayload;
    if (authorId) {
      return Author
        .findById(authorId)
        .exec()
        .then((data: AuthorType) => {
          if (!data) {
            const message = encodeURIComponent(`Wrong Author ID!!!`);

            return res.redirect(`/admin/${ENTITY.BOOK}/?error=true&message=${message}`);
          }

          return res.render(
            'admin/book/update',
            {
              title: `Add Book For : ${data.name}`,
              data : {
                authorId: {
                  id: data.id,
                  name: data.name,
                },
              },
              affiliate: {},
              entity: ENTITY.BOOK,
            },
          );
        });
    }

    return res.render(
      'admin/book/update',
      {
        title: 'Create New Book',
        data: {
          authorId: {},
        },
        affiliate: {},
        entity: ENTITY.BOOK,
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Promise.all([
      Book.findById(id)
        .populate({ path: 'authorId', select: 'name slug' })
        .exec(),
      Affiliate.findOne({ bookId: id }).exec(),
    ])
      .then(queryData => {
        const data = queryData[0];
        const affiliate = queryData[1] || {};

        if (!data) {
          const message = encodeURIComponent(`Wrong Book ID!!!`);

          return res.redirect(`/admin/${ENTITY.BOOK}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/book/update',
          {
            title: `Book Detail: ${data.title}`,
            data,
            affiliate,
            entity: ENTITY.BOOK,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Book ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.BOOK}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    const user = req.user as UserType;

    // Convert authorId to undefined
    if (!req.body.authorId) {
      req.body.authorId = undefined;
    }

    return createNewBook(req.body, user.id)
      .then(newId => {
        const message = encodeURIComponent(`Successfully added new book id: ${newId}.`);

        return res.redirect(`/admin/${ENTITY.BOOK}/${newId}/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Create book error: ' + err);
        const message = encodeURIComponent(`Adding new book error!!!`);

        return res.redirect(`/admin/${ENTITY.BOOK}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const bookId = req.body.id;
    let dataAff;

    if (!isEmptyObj(req.body.affiliate || {})) {
      dataAff = formatCommonModel(req.body.affiliate);
    }

    // Convert authorId to undefined
    if (!req.body.authorId) {
      req.body.authorId = undefined;
    }
    const updatedBook: BookType = { ...formatBookModel(req.body) };

    return Book.findByIdAndUpdate(bookId, updatedBook, function(err, model) {
      if (err) { return; }
      // Insert sitemap if changed published status
      if (updatedBook && model.verified !== updatedBook.verified) {
        const sitemapItem = createSitemapItem(`book/${updatedBook.slug}`, getDayStr());
        insertSiteMapItem(sitemapItem, SITEMAP_FILE_NAME.BOOKS);
      }
    })
      .then(() => {
        // Update affiliate
        if (dataAff) {
          Affiliate.findOne({ bookId })
            .then(affiliate => {
              if (affiliate) {
                affiliate
                  .updateOne(dataAff)
                  .exec()
                  .then(() => logger('Update Affiliate succeed.'))
                  .catch(err => logger('Update Affiliate failed: ' + err.message));
              } else {
                new Affiliate({
                    ...dataAff,
                    bookId,
                  })
                  .save()
                  .then(() => logger('Create new Affiliate succeed.'))
                  .catch(err => logger('Create new Affiliate failed: ' + err.message));
              }
            });
        }

        const message = encodeURIComponent(`Successfully updated book id: ${bookId}.`);
        return res.redirect(`/admin/${ENTITY.BOOK}/${bookId}/?success=true&message=${message}`);
      }).catch(err => {
        logger('Update book error: ' + err);
        const message = encodeURIComponent(`Updating book id: ${bookId} error!!!`);

        return res.redirect(`/admin/${ENTITY.BOOK}/${bookId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return Book.findById(id)
      .then(bookDoc => {
        return deleteBook(id)
          .then(() => {
            // Delete user activity
            deleteUserActivityAPI(
              ACTIVITY_TYPE.BOOK_ADD_NEW,
              id,
              bookDoc.userId,
            );

            const message = encodeURIComponent(`Successfully deleted book id: ${id}.`);
            return res.redirect(`/admin/${ENTITY.BOOK}/?success=true&message=${message}`);
          })
          .catch(err => {
            logger('Delete Book error: ' + err);
            const message = encodeURIComponent(`Removing book error!!!`);

            return res.redirect(`/admin/${ENTITY.BOOK}/?error=true&message=${message}`);
          });
      });
  });
