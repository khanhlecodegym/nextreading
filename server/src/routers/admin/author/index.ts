import { Router } from 'express';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { AuthorType, Author } from '../../../models/author.model';

// Constants
import { DEFAULT_QUERY_LIMIT, TYPEAHEAD_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { getFlashMessage, convertToSlug, getDayStr } from '../../../helpers/ulti';
import { formatCommonModel } from '../../../helpers/format';
import { logger } from '../../../helpers/logger';
import {
  SITEMAP_FILE_NAME,
  insertSiteMapItem,
  removeSiteMapItem,
  createSitemapItem,
} from '../../../helpers/sitemap';
import { removeImage } from '../../../helpers/file';

// Helper export functions
export const getTypeaheadAuthorAPI = (query: string) => {
  const queryRegEx = new RegExp(convertToSlug(query), 'i');

  return Author.find({
    slug: queryRegEx,
  })
    .sort('slug')
    .limit(TYPEAHEAD_QUERY_LIMIT)
    .exec()
    .then((data: AuthorType[]) => {
      return data.map(({ id, name, slug }) => ({
        name, slug, id,
      }));
    });
};

export const addNewAuthorAPI = data =>
  new Author(data).save()
    .then(author => author.id);

export const deleteAuthorAPI = (id: string) =>
  Author.findByIdAndRemove(id).exec()
  .then(() => removeImage(ENTITY.AUTHOR, id));

export const authorRouter = Router()
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
      { name: 'Name', field: 'name' },
      { name: 'Date of Birth', field: 'dob', status: true },
      { name: 'Image', field: 'img', status: true },
      { name: 'Description', field: 'description', status: true },
      { name: 'Place of Birth', field: 'pob', status: true },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return Author.find(formatQuery)
      .sort('slug')
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: 'Author Listing Page',
            entity: ENTITY.AUTHOR,
            query,
            page: Number(page),
            data,
            headers,
            ...flashMessage,
          },
        ),
      );
  })
  .get('/create', (req, res) => {
    res.render(
      'admin/author/update',
      {
        title: 'Create New Author',
        entity: ENTITY.AUTHOR,
        data: {},
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Author.findById(id)
      .then((data: AuthorType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Author ID!!!`);

          return res.redirect(`/admin/${ENTITY.AUTHOR}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/author/update',
          {
            title: `Author Detail: ${data.name}`,
            data,
            entity: ENTITY.AUTHOR,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Author ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new Author(formatCommonModel(req.body)).save()
      .then(author => {
        const sitemapItem = createSitemapItem(`author/${author.slug}`, getDayStr(), false);
        insertSiteMapItem(sitemapItem, SITEMAP_FILE_NAME.BASE);

        const message = encodeURIComponent(`Successfully added new author id: ${author.id}.`);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/${author.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        const message = encodeURIComponent(`Adding new author error!!!`);
        logger(message + 'Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const authorId = req.body.id;

    return Author.findByIdAndUpdate(authorId, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated author id: ${authorId}.`);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/${authorId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating author id: ${authorId} error!!!`);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/${authorId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return Author.findById(id)
      .then(author => {
        removeSiteMapItem(`author/${author.slug}`, SITEMAP_FILE_NAME.BASE);

        return author.remove().then(() => {
          removeImage(ENTITY.AUTHOR, id);

          const message = encodeURIComponent(`Successfully deleted author id: ${id}.`);
          return res.redirect(`/admin/${ENTITY.AUTHOR}/?success=true&message=${message}`);
        });
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing author error!!!`);

        return res.redirect(`/admin/${ENTITY.AUTHOR}/?error=true&message=${message}`);
      });
  });
