import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { getFlashMessage, getDayStr } from '../../../helpers/ulti';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { Vote } from '../../../models/vote.model';
import { UserType } from '../../../models/user.model';

export const deleteVoteAPI = (id: string) =>
  Vote.findByIdAndRemove(id).exec();

export const voteRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      userId,
      page = 1,
    } = req.query as ListingReqQueryPayload;
    let formatQuery = {};

    if (userId) {
      formatQuery = {
        userId,
      };
    }

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Review ID', field: 'reviewId', url: true },
      { name: 'User', field: 'user' },
      { name: 'Created', field: 'createdAt' },
      { name: 'Operator', field: '_' },
    ];

    return Vote.find(formatQuery)
      .sort({ createdAt: 1 })
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .populate({ path: 'userId', select: 'name username' })
      .exec()
      .then(data => {
        // Format data for foreign key Book and User
        const formatData = data.map(it => {
          const { id, reviewId, createdAt } = it;
          const { name, username } = ((it.userId || {}) as any as UserType);

          return {
            id,
            createdAt: getDayStr(createdAt),
            reviewId: `review/${reviewId}`,
            user: `${name} (${username})`,
          };
        });

        return res.render(
          'admin/common/listing',
          {
            title: `List Voting Review`,
            entity: ENTITY.VOTE,
            page: Number(page),
            data: formatData,
            headers,
            ...flashMessage,
          },
        );
      });
  });
