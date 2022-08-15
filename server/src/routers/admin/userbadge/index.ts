import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { getFlashMessage, getDayStr } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { UserBadge, UserBadgeType } from '../../../models/userBadge.model';

export const deleteAllUserBadgesByBadgeId = (badgeId: string) =>
  UserBadge.deleteMany({ badgeId }).exec()
    .then(() => true)
    .catch(() => false);

export const deleteUserBadgeAPI = (id: string) =>
  UserBadge.findByIdAndRemove(id).exec();

export const userBadgeRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      badgeId,
      userId,
      page = 1,
    } = req.query as ListingReqQueryPayload;
    let formatQuery = {};

    if (badgeId || userId) {
      formatQuery = {
        badgeId,
        userId,
      };
    }

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'User', field: 'userName' },
      { name: 'Badge', field: 'badgeName' },
      { name: 'Repeat', field: 'repeat' },
      { name: 'Created', field: 'created' },
      { name: 'Operator', field: '_' },
    ];

    return UserBadge.find(formatQuery)
      .sort({ createdAt: 1 })
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .populate({ path: 'userId', select: 'username email' })
      .populate({ path: 'badgeId', select: 'name' })
      .exec()
      .then(data => {
        // Format data for foreign key Book and User
        const formatData = data.map(it => ({
          id: it.id,
          repeat: it.repeat,
          created: getDayStr(it.createdAt),
          userName: it.userId ? (it.userId as any).email : '',
          badgeName: it.badgeId ? (it.badgeId as any).name : '',
        }));

        return res.render(
          'admin/common/listing',
          {
            title: `List User Badge`,
            entity: ENTITY.USER_BADGE,
            page: Number(page),
            data: formatData,
            headers,
            ...flashMessage,
          },
        );
      });
  })
  .get('/create', (req, res) => {
    res.render(
      'admin/userbadge/update',
      {
        title: 'Create New User Badge',
        data: {
          userId: {},
          badgeId: {},
        },
        entity: ENTITY.USER_BADGE,
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return UserBadge.findById(id)
      .populate({ path: 'userId', select: 'username email' })
      .populate({ path: 'badgeId', select: 'name' })
      .exec()
      .then((data: UserBadgeType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong User Badge ID!!!`);

          return res.redirect(`/admin/${ENTITY.USER_BADGE}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/userbadge/update',
          {
            title: `User Badge Detail: ${data.id}`,
            data,
            entity: ENTITY.USER_BADGE,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong User Badge ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new UserBadge(req.body).save()
      .then(userBadgeDoc => {
        const message = encodeURIComponent(`Successfully added new User Badge id: ${userBadgeDoc.id}.`);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/${userBadgeDoc.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        const message = encodeURIComponent(`Adding new User Badge error!!!`);
        logger(message + ': ' + err.message);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const userBadgeId = req.body.id;

    return UserBadge.findByIdAndUpdate(userBadgeId, {
      ...(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated User Badge id: ${userBadgeId}.`);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/${userBadgeId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating User Badge id: ${userBadgeId} error!!!`);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/${userBadgeId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return UserBadge.findByIdAndRemove(id)
      .then(() => {
        const message = encodeURIComponent(`Successfully deleted User Badge id: ${id}.`);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/?success=true&message=${message}`);
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing User Badge error!!!`);

        return res.redirect(`/admin/${ENTITY.USER_BADGE}/?error=true&message=${message}`);
      });
  });
