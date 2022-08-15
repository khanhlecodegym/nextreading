import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { getFlashMessage, getDayStr } from '../../../helpers/ulti';
import { calcNewRating } from '../../../helpers/rating';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { Rating } from '../../../models/rating.model';
import { Book } from '../../../models/book.model';
import { UserType, ACCOUNT_TYPE } from '../../../models/user.model';

export const deleteAllRatingByBookId = (bookId: string) =>
  Rating.deleteMany({ bookId }).exec()
    .then(() => true)
    .catch(() => false);

export const deleteRatingAPI = (id: string) => {
  return Rating.findById(id).exec()
    .then(rating => {
      const value = rating.value;

      return Book.findById(rating.bookId).exec()
        .then(book => {
          const currentRating = book.totalRating || [0, 0, 0, 0, 0];
          const newRating = calcNewRating(currentRating, value, -1);

          return Promise.all([
            // Modify total Rating
            book.updateOne({ totalRating: newRating }).exec(),
            rating.remove(),
          ]);
        });
    });
};

export const ratingRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      bookId,
      userId,
      page = 1,
    } = req.query as ListingReqQueryPayload;
    let formatQuery = {};
    const user = req.user as UserType;

    if (bookId || userId) {
      formatQuery = {
        bookId,
        userId,
      };
    }

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Book', field: 'title' },
      { name: 'User', field: 'userName' },
      { name: 'Value', field: 'value' },
      { name: 'Finish Date', field: 'finishDate' },
      { name: 'Operator', field: '_' },
    ];

    return Rating.find(formatQuery)
      .sort({ _id: -1 })
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .populate({ path: 'bookId', select: 'title' })
      .populate({ path: 'userId', select: 'username email' })
      .exec()
      .then(data => {
        // Format data for foreign key Book and User
        const formatData = data.map(it => ({
          id: it.id,
          value: it.value || 1,
          finishDate: getDayStr(it.finishDate),
          title: (it.bookId as any).title,
          userName: `${(it.userId as any).username}` + `${user.role === ACCOUNT_TYPE.ADMIN ? [(it.userId as any).email] : ''}`,
        }));

        return res.render(
          'admin/common/listing',
          {
            title: `List Rating`,
            entity: ENTITY.RATING,
            page: Number(page),
            data: formatData,
            headers,
            ...flashMessage,
          },
        );
      });
  })
  ;
