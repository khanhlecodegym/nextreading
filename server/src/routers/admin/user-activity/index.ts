import { Router } from 'express';

// Model
import { UserActivity } from '../../../models/userActivity.model';
import { User, UserType } from '../../../models/user.model';
import { ListingHeaderTypes, ListingReqQueryPayload } from '../../../models/base.model';

// Constants
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ACTIVITY, ACTIVITY_TYPE } from '../../../constants/activity';

// Helpers
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';

const ENTITY_USER_ACTIVITY = 'user-activity';

export const addUserActivityAPI = (
  activityType: ACTIVITY_TYPE,
  referId: string,
  userId: string,
) => new UserActivity({
      entity: ACTIVITY[activityType].entity,
      activity: ACTIVITY[activityType].id,
      score: ACTIVITY[activityType].value,
      referId,
      userId,
    }).save()
    .then(() => {
      return User
        .findByIdAndUpdate(
          { _id: userId },
          { $inc: { score: Number(ACTIVITY[activityType].value) }},
        )
        .exec();
    });

export const deleteUserActivityAPI = (
  activityType: ACTIVITY_TYPE,
  referId: string,
  userId: string,
) =>
  UserActivity
    .findOneAndRemove({
      entity: ACTIVITY[activityType].entity,
      activity: ACTIVITY[activityType].id,
      referId,
      userId,
    })
    .exec()
    .then(() =>
      User.findByIdAndUpdate(
        { _id: userId },
        { $inc: { score: -1 * Number(ACTIVITY[activityType].value) }},
      )
      .exec());

export const deleteUserActivityByIdAPI = (id: string) =>
  UserActivity
    .findById(id)
    .exec()
    .then(userActivity => {
      return userActivity
        .remove()
        .then(() =>
          User.findByIdAndUpdate(
            { _id: userActivity.userId },
            { $inc: { score: -1 * Number(ACTIVITY[userActivity.activity].value) }},
          )
          .exec());
    });

export const userActivityRouter = Router()
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
      { name: 'Activity', field: 'activity' },
      { name: 'Score', field: 'score' },
      { name: 'Entity', field: 'entity' },
      { name: 'Refer Id', field: 'referId', url: true },
      { name: 'User Id', field: 'userId' },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { slug: new RegExp(querySlug, 'i') };
    }

    return UserActivity.find(formatQuery)
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .populate({ path: 'userId', select: 'name username' })
      .exec()
      .then(data => {
        const dataFormat = data
          .map(it => {
            const { activity, score, entity, referId, userId } = it;
            const { name, username } = ((userId || {}) as any as UserType);

            return {
              activity,
              score,
              entity,
              referId: `${entity}/${referId}`,
              userId: `${name} (${username})`,
            };
          });

        return res.render(
          'admin/common/listing',
          {
            title: 'User Activity Listing Page',
            entity: ENTITY_USER_ACTIVITY,
            query,
            page: Number(page),
            data: dataFormat,
            headers,
            ...flashMessage,
          },
        );
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return deleteUserActivityByIdAPI(id)
      .then(() => {
        const message = encodeURIComponent(`Successfully deleted UserActivity id: ${id}.`);

        return res.redirect(`/admin/${ENTITY_USER_ACTIVITY}/?success=true&message=${message}`);
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing UserActivity error!!!`);

        return res.redirect(`/admin/${ENTITY_USER_ACTIVITY}/?error=true&message=${message}`);
      });
  })
  ;
