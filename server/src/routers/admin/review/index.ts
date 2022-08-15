import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { getFlashMessage, getDayStr } from '../../../helpers/ulti';
import { formatReviewModel } from '../../../helpers/format';
import { logger } from '../../../helpers/logger';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { Review, ReviewType } from '../../../models/review.model';
import { UserType, ACCOUNT_TYPE } from '../../../models/user.model';

export const deleteAllReviewByBookId = (bookId: string) =>
  Review.deleteMany({ bookId }).exec()
    .then(() => true)
    .catch(() => false);

export const reviewRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      bookId,
      userId,
      page = 1,
    } = req.query as ListingReqQueryPayload;
    let formatQuery = {};
    const user = req.user as UserType;

    if (bookId) {
      formatQuery = {
        bookId,
      };
    }

    if (userId) {
      formatQuery = {
        userId,
      };
    }

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Counting', field: 'counting' },
      { name: 'Score', field: 'score' },
      { name: 'Book', field: 'bookName' },
      { name: 'User', field: 'userName' },
      { name: 'Verified', field: 'verified', status: true },
      { name: 'Created', field: 'created' },
      { name: 'Operator', field: '_' },
    ];

    return Review.find(formatQuery)
      .sort({ createdAt: -1 })
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .populate({ path: 'bookId', select: 'title slug' })
      .populate({ path: 'userId', select: 'username email' })
      .exec()
      .then(data => {
        // Format data for foreign key Book and User
        const formatData = data.map(it => ({
          id: it.id,
          counting: it.counting,
          score: it.score,
          verified: it.verified,
          created: getDayStr(it.createdAt),
          bookName: it.bookId ? (it.bookId as any).title : '',
          userName: user.role === ACCOUNT_TYPE.ADMIN ? (it.userId as any).email : '',
        }));

        return res.render(
          'admin/common/listing',
          {
            title: `List Review`,
            entity: ENTITY.REVIEW,
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
      'admin/review/update',
      {
        title: 'Create New Review',
        data: {
          bookId: {},
          userId: {},
        },
        entity: ENTITY.REVIEW,
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return Review.findById(id)
      .populate({ path: 'bookId', select: 'title slug' })
      .populate({ path: 'userId', select: 'username email' })
      .exec()
      .then((data: ReviewType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong Review ID!!!`);

          return res.redirect(`/admin/${ENTITY.REVIEW}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/review/update',
          {
            title: `Review Detail: ${data.id}`,
            data,
            entity: ENTITY.REVIEW,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong Review ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.REVIEW}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new Review(formatReviewModel(req.body)).save()
      .then(reviewDoc => {
        const message = encodeURIComponent(`Successfully added new Review id: ${reviewDoc.id}.`);

        return res.redirect(`/admin/${ENTITY.REVIEW}/${reviewDoc.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        const message = encodeURIComponent(`Adding new Review error!!!`);
        logger(message + ': ' + err.message);

        return res.redirect(`/admin/${ENTITY.REVIEW}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const reviewId = req.body.id;
    const updatedReview: ReviewType = { ...formatReviewModel(req.body) };

    return Review.findByIdAndUpdate(reviewId, updatedReview, function(err, model) {
      if (err) { return; }
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated Review id: ${reviewId}.`);

        return res.redirect(`/admin/${ENTITY.REVIEW}/${reviewId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating Review id: ${reviewId} error!!!`);

        return res.redirect(`/admin/${ENTITY.REVIEW}/${reviewId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    return Review.findByIdAndRemove(id)
      .then(() => {
        const message = encodeURIComponent(`Successfully deleted Review id: ${id}.`);

        return res.redirect(`/admin/${ENTITY.REVIEW}/?success=true&message=${message}`);
      })
      .catch(() => {
        const message = encodeURIComponent(`Removing Review error!!!`);

        return res.redirect(`/admin/${ENTITY.REVIEW}/?error=true&message=${message}`);
      });
  });
