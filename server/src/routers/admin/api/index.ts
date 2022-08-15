import { Router, Request } from 'express';

// Middleware
import { isAdminGroup, isModeratorGroup } from '../../../middlewares/permission';

// Constants
import { ENTITY } from '../../../constants/entity';

// Helpers
import { saveToUploads } from '../../../helpers/file';
import { uploadImageAPI, checkDuplicatedSlug } from '../../../helpers/api';
import { logger } from '../../../helpers/logger';

// Routers
import { getCountryCodesAPI, getLanguageCodesAPI } from '../dashboard';
import { deleteBook, getTypeaheadBookAPI } from '../book';
import { getTypeaheadUserAPI } from '../user';
import { getTypeaheadAuthorAPI, deleteAuthorAPI, addNewAuthorAPI } from '../author';
import { deleteVoteAPI } from '../vote';
import { getAllCategoriesAPI, deleteCategoryAPI } from '../category';
import { getTypeaheadBadgeAPI, deleteBadgeAPI } from '../badge';
import { deleteUserBadgeAPI } from '../userbadge';
import { deleteUserActivityByIdAPI } from '../user-activity';
import { deleteRatingAPI } from '../rating';
import { formatCommonModel } from '../../../helpers/format';

// Scraping
import { scrapingBook, scrapingAuthor } from '../../../scraping';

export const apiRouter = Router()
  // Data
  .get('/all-data-refer', (req, res) => {
    return Promise.all([
      getLanguageCodesAPI(),
      getAllCategoriesAPI(),
      getCountryCodesAPI(),
    ]).then(data => {
      return res.json({
        languages: data[0],
        categories: data[1],
        countries: data[2],
      });
    });
  })
  .get('/typeahead-book', (req, res) => {
    const { query = '' } = req.query;

    if (!query) {
      return res.json([]);
    }

    return getTypeaheadBookAPI(query as string).then(data => {
      return res.json(data);
    });
  })
  .get('/typeahead-user', (req, res) => {
    const { query = '' } = req.query;

    if (!query) {
      return res.json([]);
    }

    return getTypeaheadUserAPI(query as string).then(data => {
      return res.json(data);
    });
  })
  .get('/typeahead-badge', (req, res) => {
    const { query = '' } = req.query;

    if (!query) {
      return res.json([]);
    }

    return getTypeaheadBadgeAPI(query as string).then(data => {
      return res.json(data);
    });
  })
  .get('/typeahead-author', (req, res) => {
    const { query = '' } = req.query;

    if (!query) {
      return res.json([]);
    }

    return getTypeaheadAuthorAPI(query as string).then(data => {
      return res.json(data);
    });
  })
  .post('/upload-image', saveToUploads, (req: Request, res) => {
    const { id, entity } = req.body;
    const imgFile = (req as any).file;

    return uploadImageAPI(entity, id, imgFile.originalname)
      .then((imgUrl: string) => {
        return res.json({ success: true, imgUrl });
      })
      .catch(message => {
        logger(`Upload ${entity} image error: ', ${message}`);

        return res.json({ success: false });
      });
  })
  .post('/delete-author', (req, res) => {
    const { id } = req.body;

    return deleteAuthorAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/scraping-data', (req, res) => {
    const { url, type } = req.body;

    if (type === ENTITY.AUTHOR) {
      return scrapingAuthor(url)
        .then(data => {
          return checkDuplicatedSlug(ENTITY.AUTHOR, data.slug)
            .then(duplicated =>
              res.json({
                ...data,
                duplicated,
              }));
        })
        .catch(err => res.status(501).json({ success: false }));
    } else {
      return scrapingBook(url)
        .then(data => {
          return checkDuplicatedSlug(ENTITY.BOOK, data.slug)
            .then(duplicated =>
              res.json({
                ...data,
                duplicated,
              }));
        })
        .catch(err => res.status(501).json({ success: false }));
    }
  })
  .post('/check-duplicate', (req, res) => {
    const { type, slug } = req.body;

    return checkDuplicatedSlug(type, slug)
      .then(duplicated => res.json({ duplicated }))
      .catch(err => res.status(501).json({ success: false }));
  })

  // Limit restriction by permission
  // Moderator Group
  .post('/delete-book', isModeratorGroup, (req, res) => {
    const { id } = req.body;

    // return res.json({ success: true });
    return deleteBook(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/delete-vote', (req, res) => {
    const { id } = req.body;

    return deleteVoteAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/delete-badge', (req, res) => {
    const { id } = req.body;

    return deleteBadgeAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/delete-userbadge', (req, res) => {
    const { id } = req.body;

    return deleteUserBadgeAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/delete-useractivity', (req, res) => {
    const { id } = req.body;

    return deleteUserActivityByIdAPI(id)
      .then(() => res.json({ success: true }))
      .catch(err => res.status(501).json({ success: false, message: err.message }));
  })
  .post('/delete-rating', (req, res) => {
    const { id } = req.body;

    return deleteRatingAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  // Admin Group
  .post('/delete-category', isAdminGroup, (req, res) => {
    const { id } = req.body;

    return deleteCategoryAPI(id)
      .then(() => res.json({ success: true }))
      .catch(() => res.json({ success: false }));
  })
  .post('/add-new-author', (req, res) => {
    return addNewAuthorAPI(formatCommonModel(req.body))
    .then(id => {
      res.json({ success: true, id });
    })
    .catch(() => res.status(501).json({ success: false }));
  });
