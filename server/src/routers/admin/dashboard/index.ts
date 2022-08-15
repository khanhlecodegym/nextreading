import { Router } from 'express';

// Constants
import { ACTIVITY, ACTIVITY_TYPE } from '../../../constants/activity';
import { languageCodes } from '../../../constants/language-code';
import { countryCodes } from '../../../constants/country-code';

// Models
import { Book } from '../../../models/book.model';
import { User, UserType } from '../../../models/user.model';
import { Rating } from '../../../models/rating.model';
import { Review } from '../../../models/review.model';

// Middleware
import { isAdminGroup } from '../../../middlewares/permission';

// Helper
import { initCategory, initAuthor } from '../../../helpers/seed-data';
import {
  generateSitemap,
  generateBooksSitemap,
} from '../../../helpers/sitemap';

export const getLanguageCodesAPI = () => languageCodes;

export const getCountryCodesAPI = () => countryCodes;

export const dashboardRouter = Router()
  .get('/', (req, res) => {
    res.render(
      'admin/dashboard/index',
      {
        title: 'Dashboard',
      },
    );
  })
  // This init data and generate sitemap
  // .get('/init-site', isAdminGroup, (req, res) => {
  //   return Promise.all([
  //     initCategory(),
  //     initAuthor(),
  //   ])
  //   // Generate sitemap after got seed data
  //   .then(() =>
  //     generateSitemap()
  //       .then(() => res.json({ message: 'Init site succeed.' }))
  //       .catch(() => res.json({ message: 'Init sitemap error!!!' })));
  // })
  // .get('/generate-sitemap-book', isAdminGroup, (req, res) => {
  //   return generateBooksSitemap()
  //     .then(() => res.json({ message: 'Generate Book sitemap succeed.' }))
  //     .catch(() => res.json({ message: 'Generate Book sitemap error!!!' }));
  // })
  // .get('/reset-score', isAdminGroup, (req, res) => {
  //   return Promise.all([
  //     // Reset score
  //     User.updateMany(
  //       {},
  //       { $set: { score: 0 } },
  //     ),
  //     Review.updateMany(
  //       {},
  //       { $set: { score: 0 } },
  //     ),
  //     // Assign Book userId to Editor account
  //     Book.updateMany(
  //       { userId: { $in: [null, undefined] } },
  //       { $set: { userId: '5fabcdc89fd8861eea5fd200' }},
  //     ).exec(),
  //   ])
  //   .then(() => {
  //     return User.find().then(users => {
  //       return users.map(user => {
  //         return Promise.all([
  //           Book
  //             .find({ userId: user.id })
  //             .then(userBooks => {
  //               return (userBooks.length || 0) * ACTIVITY[ACTIVITY_TYPE.BOOK_ADD_NEW].value;
  //             }),
  //           Review
  //             .find({ userId: user.id })
  //             .then(userReviews => {
  //               return (userReviews.length || 0) * ACTIVITY[ACTIVITY_TYPE.REVIEW_ADD_NEW].value;
  //             }),
  //           Rating
  //             .find({ userId: user.id })
  //             .then(userRating => {
  //               return (userRating.length || 0) * ACTIVITY[ACTIVITY_TYPE.BOOK_RATING].value;
  //             }),
  //         ]).then(userData => {
  //           const bookScore = userData[0];
  //           const reviewScore = userData[1];
  //           const ratingScore = userData[2];
  //           const totalScore = bookScore + reviewScore + ratingScore;

  //           return user.updateOne({ score: totalScore }).exec();
  //         });
  //       });
  //     });
  //   })
  //   .then(() => res.json({ message: 'Reset and Update system score succeed.' }))
  //   .catch(err => {
  //     return res.json({ message: 'Reset score error!!!' + err.message });
  //   });
  // })
  ;
