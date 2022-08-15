import { Request, Response } from 'express';

// Constants
import { ACTIVITY_TYPE } from '../../constants/activity';

// Helpers
import { logger } from '../../helpers/logger';
import { calcNewRating } from '../../helpers/rating';

// Models
import { Book } from '../../models/book.model';
import { Rating } from '../../models/rating.model';
import { UserType } from '../../models/user.model';

// Router
import { addUserActivityAPI } from '../admin/user-activity';
import { ToggleCurrentReadingBook, ToggleWantToReadBook } from './book';

export const RatingBookAPI = (
  req: Request,
  res: Response,
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false });
  }

  const { bookId, value, startDate, finishDate } = req.body;
  const userId = (user as UserType).id;

  return Promise.all([
    Book.findById(bookId).exec(),
    Rating.findOne({ bookId, userId }).exec(),
  ])
  .then(data => {
    const book = data[0];
    const rating = data[1];
    const currentRating = book.totalRating || [0, 0, 0, 0, 0];

    // Calc new total Rating
    const newRating = calcNewRating(currentRating, value, +1);

    // Remove undefined fields
    const updateData = JSON.parse(JSON.stringify({
      value,
      startDate,
      finishDate
    }));

    // Add / Remove item from current reading list
    if (updateData.finishDate) {
      // Remove from current reading
      ToggleCurrentReadingBook(bookId, userId, false);
    } else if (updateData.startDate) {
      // Remove from want-to-read
      ToggleWantToReadBook(bookId, userId, false);

      // Adding to current reading
      if (!rating) {
        ToggleCurrentReadingBook(bookId, userId, true);
      }
    }

    if (rating) {
      const prevValue = rating.value;
      const updateRating = value ? calcNewRating(newRating, prevValue, -1) : currentRating;

      // Add user activity for book rating
      if (!prevValue && value) {
        addUserActivityAPI(
          ACTIVITY_TYPE.BOOK_RATING,
          rating.bookId,
          userId,
        );
      }

      return Promise.all([
        // Modify total Rating
        book.updateOne({ totalRating: updateRating }).exec(),
        rating.updateOne(updateData).exec(),
      ])
      .then(() => res.json({
        success: true,
        ...updateData
      }))
      .catch(err => {
        logger(`Remove vote error: ${err.message}`);
        return res.status(501).json({ success: false });
      });
    }

    return Promise.all([
      // Increase score
      book.updateOne({ totalRating: newRating }).exec(),
      new Rating({
        bookId,
        userId,
        ...updateData
      }).save(),
    ])
    .then(dataNew => {
      const ratingDoc = dataNew[1];

      // Add user activity for book rating
      if (ratingDoc.value) {
        addUserActivityAPI(
          ACTIVITY_TYPE.BOOK_RATING,
          ratingDoc.bookId,
          userId,
        );
      }

      return res.json({
        success: true,
        ...updateData
      });
    })
    .catch(err => {
      logger(`Add new vote error: ${err.message}`);
      return res.status(501).json({ success: false });
    });
  });
};
