import { Router } from 'express';

// Model
import { BadgeType, Badge, BADGE_TYPE } from '../../../models/badge.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';

// Constants
import { DEFAULT_QUERY_LIMIT, TYPEAHEAD_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';

// Helpers
import { formatCommonModel } from '../../../helpers/format';
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

// Router
import { deleteAllUserBadgesByBadgeId } from '../userbadge';

const getBadgeTypes = () =>
  Object.keys(BADGE_TYPE)
    .filter(it => !isNaN(Number(it)))
    .map(key => ({
      value: Number(key),
      text: BADGE_TYPE[Number(key)],
    }));

export const getTypeaheadBadgeAPI = (query: string) => {
  const queryRegEx = new RegExp(convertToSlug(query), 'i');

  return Badge.find({
    name: queryRegEx,
  })
    .limit(TYPEAHEAD_QUERY_LIMIT)
    .exec()
    .then((data: BadgeType[]) => {
      return data.map(({ id, name, type }) => ({
        name, type, id,
      }));
    });
};

export const addNewBadgeAPI = data =>
  new Badge(data).save()
    .then(badge => badge.id);

export const deleteBadgeAPI = (id: string) =>
  Badge.findById(id)
    .exec()
    .then((badge: BadgeType) => {
      return deleteAllUserBadgesByBadgeId(id).then(() => {
        logger('Finished delete all user badge belong to bagedId: ' + id);
        return badge.remove();
      });
    });

export const badgeRouter = Router()
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
      { name: 'ID', field: 'id' },
      { name: 'Name', field: 'name' },
      { name: 'Type', field: 'type' },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return Badge.find(formatQuery)
      .sort('slug')
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .exec()
      .then(data =>
        res.render(
          'admin/common/listing',
          {
            title: 'Badge Listing Page',
            entity: ENTITY.BADGE,
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
      'admin/badge/update',
      {
        title: 'Create New Badge',
        entity: ENTITY.BADGE,
        badgeTypes: getBadgeTypes(),
        data: {},
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Badge.findById(id)
      .then((data: BadgeType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Badge ID!!!`);

          return res.redirect(`/admin/${ENTITY.BADGE}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/badge/update',
          {
            title: `Badge Detail: ${data.name}`,
            badgeTypes: getBadgeTypes(),
            data,
            entity: ENTITY.BADGE,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Badge ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.BADGE}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new Badge(formatCommonModel(req.body)).save()
      .then(badge => {
        const message = encodeURIComponent(`Successfully added new badge id: ${badge.id}.`);

        return res.redirect(`/admin/${ENTITY.BADGE}/${badge.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        const message = encodeURIComponent(`Adding new badge error!!!`);
        logger(message + 'Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.BADGE}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const badgeId = req.body.id;

    return Badge.findByIdAndUpdate(badgeId, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated badge id: ${badgeId}.`);

        return res.redirect(`/admin/${ENTITY.BADGE}/${badgeId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating badge id: ${badgeId} error!!!`);

        return res.redirect(`/admin/${ENTITY.BADGE}/${badgeId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return deleteBadgeAPI(id)
      .then(() => {
        const message = encodeURIComponent(`Successfully deleted badge id: ${id}.`);

        return res.redirect(`/admin/${ENTITY.BADGE}/?success=true&message=${message}`);
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing Badge error!!!`);

        return res.redirect(`/admin/${ENTITY.BADGE}/?error=true&message=${message}`);
      });
  });
