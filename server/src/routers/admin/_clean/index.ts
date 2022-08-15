import { Router } from 'express';

// Helpers
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

// Model
import { Affiliate } from '../../../models/affiliate.model';
import { Review } from '../../../models/review.model';
import { Vote } from '../../../models/vote.model';
import { User } from '../../../models/user.model';
import { Category } from '../../../models/category.model';
import { Rating } from '../../../models/rating.model';

// Constants
import { categories } from '../../../constants/data/category';

export const cleanRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);

    return res.render(
      'admin/clean/index',
      {
        title: 'Admin Clean Data',
        ...flashMessage,
      },
    );
  })
  .get('/affiliate', (req, res) => {
    return Affiliate.deleteMany({
      fahasa: '',
      vinabook: '',
      tiki: '',
      lazada: '',
      shopee: '',
      amazon: '',
    })
    .exec()
    .then(() => {
      const message = encodeURIComponent('Successfully clean Affiliate data');
      return res.redirect(`/admin/clean/?success=true&message=${message}`);
    })
    .catch(err => {
      logger('Clean Affiliate error: ' + err);

      const message = encodeURIComponent(`Clean Affiliate data error!!!`);
      return res.redirect(`/admin/clean/?error=true&message=${message}`);
    });
  })
  .get('/category', (req, res) => {
    return Category.find()
      .exec()
      .then(data => {
        data.map((it, idx) => {
          const updateCategory = categories.find(cat => cat.slug === it.slug);

          if (updateCategory) {
            it.updateOne({
              ...updateCategory
            }).exec();
            console.log('[', idx, '] ', it.id, ' slug: ', it.slug);
          }
        });
        const message = encodeURIComponent('Successfully update Category data');
        return res.redirect(`/admin/clean/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Update Category error: ' + err);

        const message = encodeURIComponent(`Update Category data error!!!`);
        return res.redirect(`/admin/clean/?error=true&message=${message}`);
      });
  })

  // FINISHED CLEAN DATA
  /*
  .get('/rename', (req, res) => {
    return Rating.updateMany(
      {},
      { $rename: { finishedDate: 'finishDate' } },
      { multi: true },
      (err, blocks) => {
        if (err) { throw err; }
        console.log('done!');
      }
    )
    .exec()
    .then(() => {
      const message = encodeURIComponent('Successfully rename Rating schema field');
      return res.redirect(`/admin/clean/?success=true&message=${message}`);
    })
    .catch(err => {
      logger('Clean Affiliate error: ' + err);

      const message = encodeURIComponent(`Rename Rating schema field error!!!`);
      return res.redirect(`/admin/clean/?error=true&message=${message}`);
    });
  })

  // Force lowercase username
  .get('/username', (req, res) => {
    return User.find()
      .exec()
      .then(data => {
        data.map((it, idx) => {
          it.updateOne({
            username: it.username.toLowerCase()
          }).exec();
          // console.log('[', idx, '] ', it.id, ' username: ', it.username);
        });
        const message = encodeURIComponent('Successfully clean Username data');
        return res.redirect(`/admin/clean/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Clean Username error: ' + err);

        const message = encodeURIComponent(`Clean Username data error!!!`);
        return res.redirect(`/admin/clean/?error=true&message=${message}`);
      });
  })
  // Update Review counting and set default Score
  .get('/review', (req, res) => {
    return Review.find()
      .sort({ createdAt: 1 })
      .exec()
      .then(data => {
        data.map((it, idx) => {
          it.updateOne({
            counting: idx + 1,
            score: it.score || 0,
          }).exec();
          // console.log('[', idx, '] ', it.id, ' - createdAt: ', it.createdAt, ' counting: ', it.counting);
        });
        const message = encodeURIComponent('Successfully clean Review data');
        return res.redirect(`/admin/clean/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Clean Review error: ' + err);

        const message = encodeURIComponent(`Clean Review data error!!!`);
        return res.redirect(`/admin/clean/?error=true&message=${message}`);
      });
  })
  .get('/vote', (req, res) => {
    return Vote.find()
      .sort({ createdAt: 1 })
      .exec()
      .then(data => {
        data.map(it => {
          if (it.reviewId) {
            Review.findById(it.reviewId)
              .then(review => {
                if (!review) {
                  // console.log('it: ', it.id, ' - not found reviewId: ', it.reviewId);
                  it.remove();
                }
              });
          } else {
            // console.log('item null reviewId: ', it.id);
            it.remove();
          }
        });

        const message = encodeURIComponent('Successfully clean Vote data');
        return res.redirect(`/admin/clean/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Clean Vote error: ' + err);

        const message = encodeURIComponent(`Clean Vote data error!!!`);
        return res.redirect(`/admin/clean/?error=true&message=${message}`);
      });
  })
  */
  ;
