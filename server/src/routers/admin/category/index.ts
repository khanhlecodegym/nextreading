import { Router } from 'express';

// Model
import { CategoryType, Category } from '../../../models/category.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';

// Constants
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { formatCommonModel } from '../../../helpers/format';
import { getFlashMessage, convertToSlug, getDayStr } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';
import {
  SITEMAP_FILE_NAME,
  insertSiteMapItem,
  removeSiteMapItem,
  createSitemapItem,
} from '../../../helpers/sitemap';

export const getAllCategoriesAPI = () => {
  return Category.find()
    .sort('slug')
    .exec()
    .then((data: CategoryType[]) => {
      return data.map(({ id, slug, isFiction, name, vnName }) => ({
        id,
        slug,
        isFiction,
        name: `${name} (${vnName})`
      }));
    });
};

export const deleteCategoryAPI = (id: string) =>
  Category.findByIdAndRemove(id).exec();

export const categoryRouter = Router()
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
      { name: 'Is Fiction', field: 'isFiction', status: true },
      { name: 'Name', field: 'name' },
      { name: 'Vietnamese Name', field: 'vnName' },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return Category.find(formatQuery)
      .sort('slug')
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: 'Category Listing Page',
            entity: ENTITY.CATEGORY,
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
      'admin/common/update',
      {
        title: 'Create New Category',
        entity: ENTITY.CATEGORY,
        data: {},
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Category.findById(id).exec()
      .then((data: CategoryType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Category ID!!!`);

          return res.redirect(`/admin/${ENTITY.CATEGORY}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/common/update',
          {
            title: `Category Detail: ${data.id}`,
            data,
            entity: ENTITY.CATEGORY,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Category ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new Category(formatCommonModel(req.body)).save()
      .then(category => {
        const sitemapItem = createSitemapItem(`category/${category.slug}`, getDayStr(), false);
        insertSiteMapItem(sitemapItem, SITEMAP_FILE_NAME.BASE);

        const message = encodeURIComponent(`Successfully added new category id: ${category.id}.`);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/${category.id}/?success=true&message=${message}`);
      })
      .catch(() => {
        const message = encodeURIComponent(`Adding new category error!!!`);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const categoryId = req.body.id;

    return Category.findByIdAndUpdate(categoryId, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated category id: ${categoryId}.`);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/${categoryId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating category id: ${categoryId} error!!!`);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/${categoryId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return Category.findById(id)
      .then(category => {
        removeSiteMapItem(`category/${category.slug}`, SITEMAP_FILE_NAME.BASE);
        const message = encodeURIComponent(`Successfully deleted category id: ${id}.`);

        category.remove().then(() =>
          res.redirect(`/admin/${ENTITY.CATEGORY}/?success=true&message=${message}`));
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing category error!!!`);

        return res.redirect(`/admin/${ENTITY.CATEGORY}/?error=true&message=${message}`);
      });
  });
