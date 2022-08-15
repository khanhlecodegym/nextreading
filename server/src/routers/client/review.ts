import { Request, Response } from 'express';

// Constants
import { ACTIVITY_TYPE } from '../../constants/activity';
import { languageCodes } from '../../constants/language-code';
import { SEO_DESC_MAX } from '../../constants/seo';

// Helpers
import { logger } from '../../helpers/logger';
import { formatReviewModel } from '../../helpers/format';
import { getTextOnly } from '../../helpers/ulti';

// Models
import { Book } from '../../models/book.model';
import { Review } from '../../models/review.model';
import { UserType } from '../../models/user.model';
import { Affiliate } from '../../models/affiliate.model';
import { Rating } from '../../models/rating.model';

// Router
import { addUserActivityAPI } from '../admin/user-activity';
import { getRelatedBooks, getBookRating } from './book';

export const GetAddReview = (
  req: Request,
  res: Response,
) => {
  const { slug } = req.params;

  return Book.findOne({ slug, verified: true })
    .select('id slug title')
    .exec()
    .then(book => {
      if (!book) {
        logger('Not found book: ' + slug);
        return res.redirect(`/`);
      }

      return res.render(
        'client/none-content/add-review',
        {
          title: `Review Book: ${book.title}`,
          data: {
            id: book.id,
            title: book.title,
            slug: book.slug,
            content: '',
          },
        },
      );
    });
};

export const PostAddReview = (
  req: Request,
  res: Response,
) => {
  const {
    bookId,
    content,
    reviewId = '',
  } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ success: false });
  }

  const userId = (user as UserType).id;

  return Book.findById(bookId)
    .select('id slug title')
    .exec()
    .then(book => {
      if (!book) {
        logger('Not found book by Id: ' + bookId);
        return res.status(501).json({ success: false });
      }

      const data = {
        content,
        bookId,
        userId,
      };

      if (reviewId) {
        return Review.findByIdAndUpdate(
          reviewId,
          formatReviewModel(data),
        ).exec()
          .then(() => res.json({ success: true }))
          .catch(err => {
            const message = encodeURIComponent(`Updating Review error!!!`);
            logger(message + ': ' + err.message);

            return res.status(501).json({ success: false, message });
          });
      } else {
        return new Review(formatReviewModel(data)).save()
          .then(review => {
            // Add user activity
            addUserActivityAPI(
              ACTIVITY_TYPE.REVIEW_ADD_NEW,
              review.id,
              userId,
            );

            return res.json({ success: true });
          })
          .catch(err => {
            const message = encodeURIComponent(`Adding new Review error!!!`);
            logger(message + ': ' + err.message);

            return res.status(501).json({ success: false, message });
          });
      }
    });
};

export const ReviewDetailByCounting = (
  req: Request,
  res: Response,
) => {
  const { counting } = req.params;

  return Review.findOne({ counting: Number(counting) })
    .then(review => {
      if (!review) {
        logger('Not found Review detail counting : ' + counting);
        return res.redirect(`/`);
      }

      return Book.findById(review.bookId)
        .then(book => {
          if (!book) {
            logger('Not found Book by review detail counting : ' + counting);
            return res.redirect(`/`);
          }

          return res.redirect(`/review/${counting}/${book.slug}`);
        });
    });
};

export const ReviewDetail = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  const { counting, bookSlug } = req.params;
  const user = (req.user || {}) as UserType;
  const userId = user.id;
  const selectedFieldsBook = [
    'id', 'title', 'slug', 'verified', 'img',
    'totalRating', 'isbn', 'numberOfPages', 'language',
    'datePublished', 'authorId', 'categoryIds',
    'seoTitle', 'seoDesc', 'createdAt',
  ];

  return Promise.all([
    Review.findOne({ counting: Number(counting) })
      .populate({ path: 'userId', select: 'username name img' })
      .exec(),
    Book.findOne({ slug: bookSlug })
      .select(selectedFieldsBook.join(' '))
      .populate({ path: 'authorId', select: 'name slug' })
      .populate({ path: 'userId', select: 'username name img' })
      .exec(),
  ]).then(data => {
    const review = data[0];
    const book = data[1];

    if (!book) {
      logger('Not found book: ' + bookSlug);
      return res.redirect(`/`);
    }

    return Promise.all([
      Affiliate.findOne({ bookId: book.id }).exec(),
      getRelatedBooks(book.id, book.categoryIds),
      Rating.findOne({ bookId: book.id, userId }).exec(),
    ]).then(extraData => {
      const affiliate = extraData[0];
      const relatedBooks = extraData[1];
      const lastRating = extraData[2];
      const reviewCount = 0;
      const { ratingAVG, ratingCount } = getBookRating(book.totalRating);

      // Lookup language code
      const bookLang = languageCodes.find(it => it.name === book.language);
      const seoTitle = `${book.title} review by ${user.name || user.username}`;
      const seoDesc = `${getTextOnly(review.content).substr(0, SEO_DESC_MAX - 5)}...`;

      return res.render(
        isAMP ? 'client/amp/review' : 'client/review',
        {
          ...book.toJSON(),
          seoTitle,
          seoDesc,
          bookSlug,
          review,
          reviewCounting: counting,
          relatedBooks,
          affiliate: affiliate || {},
          ratingAVG,
          ratingCount,
          reviewCount,
          authorId: book.authorId || {},
          rating: lastRating || {},
          isBookPage: true, // For page layout
          langCode: bookLang ? bookLang.code : 'en',
        },
      );
    });
  });
};
