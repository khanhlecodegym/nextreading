import { Request, Response } from 'express';

// Constants
import { ACTIVITY_TYPE } from '../../constants/activity';

// Helpers
import { logger } from '../../helpers/logger';

// Models
import { Vote } from '../../models/vote.model';
import { UserType } from '../../models/user.model';
import { Review } from '../../models/review.model';

// Router
import { addUserActivityAPI, deleteUserActivityAPI } from '../admin/user-activity';

export const VoteReviewAPI = (
  req: Request,
  res: Response,
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false });
  }

  const { id } = req.body;
  const userId = (user as UserType).id;

  if (!id) {
    return res.status(200).json({
      success: false,
      message: `You can't vote for your own review`,
    });
  }

  return Promise.all([
    Review.findById(id).exec(),
    Vote.findOne({
      reviewId: id,
      userId,
    }).exec(),
  ])
  .then(dataAPI => {
    const review = dataAPI[0];
    const vote = dataAPI[1];
    const currentScore = review.score || 0;

    if (vote) {
      return Promise.all([
        review.updateOne({ score: currentScore - 1 }).exec(),
        vote.remove(),
      ])
      .then(() => {
        // Delete user activity
        deleteUserActivityAPI(
          ACTIVITY_TYPE.REVIEW_UP_VOTE,
          review.id,
          review.userId,
        );
        return res.json({ success: true, score: currentScore - 1 });
      })
      .catch(err => {
        logger(`Remove vote error: ${err.message}`);
        return res.status(501).json({
          success: false,
          message: 'Removing vote review error!',
          system: err.message,
        });
      });
    }

    return Promise.all([
      review.updateOne({ score: currentScore + 1 }).exec(),
      new Vote({
        reviewId: id,
        userId,
      }).save(),
    ])
    .then(() => {
      // Add user activity
      addUserActivityAPI(
        ACTIVITY_TYPE.REVIEW_UP_VOTE,
        review.id,
        review.userId,
      );

      return res.json({ success: true, score: currentScore + 1 });
    })
    .catch(err => {
      logger(`Add new vote error: ${err.message}`);
      return res.status(501).json({
        success: false,
        message: 'Adding new vote review error!',
        system: err.message,
      });
    });
  });
};
