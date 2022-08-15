import { Request, Response } from 'express';

// Helpers
import {
  NUMBER_SUGGESTION_BOOK,
  PAGINATION_REVIEWS,
  REVIEW_ORDER_FIELD,
  getUserSettings,
} from './_helpers';
import { logger } from '../../helpers/logger';
import { convertToSlug } from '../../helpers/ulti';
import { formatBookModel } from '../../helpers/format';

// Constants
import { ENTITY } from '../../constants/entity';
import { ACTIVITY_TYPE } from '../../constants/activity';
import { languageCodes } from '../../constants/language-code';

// Models
import { Book, BookType } from '../../models/book.model';
import { User, UserType } from '../../models/user.model';
import { Rating } from '../../models/rating.model';
import { Review } from '../../models/review.model';
import { Vote } from '../../models/vote.model';
import { Affiliate } from '../../models/affiliate.model';

// Router
import { addUserActivityAPI } from '../admin/user-activity';

/**
 * Related books:
 * Re-commend from users (TODO), the same category/author
 */
export const getRelatedBooks = (bookId: string, categoryIds: string[] = []) => {
  return Book.find({
      _id: { $ne: bookId },
      categoryIds: { $in: categoryIds },
    })
    .select('title slug img')
    .limit(NUMBER_SUGGESTION_BOOK)
    .exec()
    .then(data => data)
    .catch(err => {
      logger('Get related books err: ' + err.message);
      return [];
    });
};

export const getBookRating = (totalRating: number[]) => {
  // Calculating rating value
  let ratingAVG = 0;
  let ratingCount = 0;
  let totalRatingValue = 0;

  for (const [idx, value] of totalRating.entries()) {
    ratingCount += value;
    totalRatingValue += value * (idx + 1);
  }

  ratingAVG = totalRatingValue / ratingCount;

  return {
    ratingAVG,
    ratingCount,
  };
};

/**
 * Toggle bookId in current-reading list
 * @param bookId 
 * @param userId 
 * @param isAdding Add / Remove from current listing
 * @returns 
 */
export const ToggleCurrentReadingBook = (
  bookId: string,
  userId: string,
  isAdding: boolean = true
) => {
  return Promise.all([
    Book.findById(bookId).exec(),
    User.findById(userId).exec(),
  ]).then(data => {
    const bookData = data[0];
    const userData = data[1];
    const currentReadingBooks = userData.currentReading || [];
    const isExists = currentReadingBooks.indexOf(bookId) !== -1;
    let newReadingBooks: string[] = currentReadingBooks;

    if (!bookData || !userData) {
      return {
        success: false,
        isAdding
      }
    }

    if (isAdding) {
      if (!isExists) {
        newReadingBooks = [...currentReadingBooks, ...[bookId]];
      }
    } else {
      if (isExists) {
        newReadingBooks = currentReadingBooks.filter(it => it !== bookId);
      }
    }

    return userData
      .updateOne({ currentReading: newReadingBooks })
      .exec()
      .then(() => {
        return {
          success: true,
          isAdding
        }
      });
  })
  .catch(err => {
    logger(`ToggleCurrentReadingBook error: ${err.message}`);
    throw err;
  });
};

/**
 * Toggle bookId in want-to-read list
 * @param bookId 
 * @param userId 
 * @param isAdding Add / Remove from current listing
 * @returns 
 */
export const ToggleWantToReadBook = (
  bookId: string,
  userId: string,
  isAdding: boolean = true
) => {
  return Promise.all([
    Book.findById(bookId).exec(),
    User.findById(userId).exec(),
  ]).then(data => {
    const bookData = data[0];
    const userData = data[1];
    const currentWantToReadBooks = userData.wantToRead || [];
    const isExists = currentWantToReadBooks.indexOf(bookId) !== -1;
    let newWantToReadBooks: string[] = currentWantToReadBooks;

    if (!bookData || !userData) {
      return {
        success: false,
        isAdding
      }
    }

    if (isAdding) {
      if (!isExists) {
        newWantToReadBooks = [...currentWantToReadBooks, ...[bookId]];
      }
    } else {
      if (isExists) {
        newWantToReadBooks = currentWantToReadBooks.filter(it => it !== bookId);
      }
    }

    return userData
      .updateOne({ wantToRead: newWantToReadBooks })
      .exec()
      .then(() => {
        return {
          success: true,
          isAdding
        }
      });
  })
  .catch(err => {
    logger(`ToggleWantToReadBook error: ${err.message}`);
    throw err;
  });
};

export const SearchBookAPI = (
  req: Request,
  res: Response,
) => {
  const query = req.query.query as string;
  const querySlug = convertToSlug(query);
  const formatQuery = {
    slug: new RegExp(querySlug, 'i'),
  };
  let exactMatch = false;

  return Book.find(formatQuery)
    .select('title slug verified img')
    .limit(10)
    .populate({ path: 'authorId' })
    .exec()
    .then(data => {
      const formatData = data.map(it => {
        if (querySlug === it.slug) {
          exactMatch = true;
        }

        return {
          slug: it.slug,
          title: it.title,
          verified: it.verified,
          img: it.img,
          author: (it.authorId || {} as any).name || '',
        };
      });

      return res.json({
        success: true,
        books: formatData,
        exactMatch,
      });
    })
    .catch(err => res.status(501).json({
      success: false,
      books: [],
      exactMatch: false,
    }));
};

export const ToggleReadingBookAPI = (
  req: Request,
  res: Response,
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Un-auth',
    });
  }

  const { bookId, isAdding } = req.body;
  const userId = (user as UserType).id;

  return ToggleCurrentReadingBook(bookId, userId, isAdding)
    .then(({ success, isAdding }) => {
      if (!success) {
        return res.status(501).json({ success, message: 'Not found Book' });
      }

      return res.status(200).json({
        success,
        isAdding,
        message: isAdding ? 'Adding New' : 'Remove Book!'
      });
  })
  .catch(err => {
    logger(`Not found Book or User: ${err.message}`);
    return res.status(501).json({ success: false, message: 'Not found Data!' });
  });
};

export const ToggleWantToReadBookAPI = (
  req: Request,
  res: Response,
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Un-auth',
    });
  }

  const { bookId, isAdding } = req.body;
  const userId = (user as UserType).id;

  return ToggleWantToReadBook(bookId, userId, isAdding)
    .then(({ success, isAdding }) => {
      if (!success) {
        return res.status(501).json({ success, message: 'Not found Book' });
      }

      return res.status(200).json({
        success,
        isAdding,
        message: isAdding ? 'Adding New' : 'Remove Book!'
      });
  })
  .catch(err => {
    logger(`Not found Book or User: ${err.message}`);
    return res.status(501).json({ success: false, message: 'Not found Data!' });
  });
};

export const BookDetail = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  const { slug } = req.params;
  const { page = 1, sort = 'newest' } = req.query;
  const currentPage = Number(page);
  const user = (req.user || {}) as UserType;
  const userId = user.id;
  const selectedFieldsBook = [
    'id', 'title', 'slug', 'verified', 'img',
    'totalRating', 'isbn', 'numberOfPages', 'language',
    'datePublished', 'description', 'authorId', 'categoryIds',
    'seoTitle', 'seoDesc', 'createdAt',
  ];

  return Book.findOne({ slug })
    .select(selectedFieldsBook.join(' '))
    .populate({ path: 'authorId', select: 'name slug' })
    .exec()
    .then(book => {
      if (!book) {
        logger('Not found book: ' + slug);
        return res.redirect(`/`);
      }

      // Update views increase
      Book
        .findByIdAndUpdate({ _id: book.id }, { $inc: { views: 1 }})
        .exec();

      return Promise.all([
        // Number of reviews
        Review.find({ bookId: book.id }).countDocuments().exec(),

        // Popular reviews
        Review.find({ bookId: book.id })
          .sort(REVIEW_ORDER_FIELD[sort.toString()])
          .skip((currentPage - 1) * PAGINATION_REVIEWS)
          .limit(PAGINATION_REVIEWS)
          .populate({ path: 'userId', select: 'username name img' })
          .exec(),

        // Current User rating
        Rating.findOne({ bookId: book.id, userId })
          .exec(),

        // Affiliate
        Affiliate.findOne({ bookId: book.id }).exec(),

        // Related Books
        getRelatedBooks(book._id, book.categoryIds),
      ]).then(data => {
        const numberOfReviews = data[0];
        const reviews = data[1];
        const lastRating = data[2];
        const affiliate = data[3];
        const relatedBooks = data[4];
        const userReviewIds = [];

        // Remove duplicated items with popular reviews
        const popularReviewIds = reviews.map(it => {
          userReviewIds.push((it.userId as any as UserType).id);
          return it.id;
        });
        const recentReviews = data[1].filter(it => popularReviewIds.indexOf(it.id) === -1);
        const recentReviewIds = recentReviews.map(it => {
          userReviewIds.push((it.userId as any as UserType).id);
          return it.id;
        });
        // Unique userId
        const userIds = [...new Set( userReviewIds)];

        return Promise.all([
          // Get list reviews voted by current user
          Vote.find({
              userId,
              reviewId: { $in: [...popularReviewIds, ...recentReviewIds]},
            })
            .select('reviewId')
            .exec(),
          // Get rating values by each review and user
          Rating.find({
            bookId: book.id,
            userId: { $in: userIds },
          })
          .exec(),
        ])
        .then(dataReview => {
          const votes = dataReview[0];
          const ratings = dataReview[1];
          const votedReviews = votes.map(it => it.reviewId);

          const reviewsWithRating = reviews.map(it => {
            const authorReviewRated = ratings.find(item =>
              item.userId.toString() ===
                (it.userId as any as UserType).id.toString(),
            );

            return {
              ...it.toJSON(),
              rated: authorReviewRated ? authorReviewRated.value : 0,
            };
          });

          const { ratingAVG, ratingCount} = getBookRating(book.totalRating);

          // Lookup language code
          const bookLang = languageCodes.find(it => it.name === book.language);

          return res.render(
            isAMP ? 'client/amp/book' : 'client/book',
            {
              ...book.toJSON(),
              // Pagination data
              numberOfReviews,
              page,
              sort,
              // Other data
              relatedBooks,
              affiliate: affiliate || {},
              ratingAVG,
              ratingCount,
              authorId: book.authorId || {},
              reviews: reviewsWithRating,
              votedReviews,
              rating: lastRating || {},
              isBookPage: true,
              langCode: bookLang ? bookLang.code : 'en',
            },
          );
        });
      });
    });
};

export const GetAddingBook = (
  req: Request,
  res: Response,
) => {
  const bookTitle = req.query.title as string;

  return res.render(
    'client/none-content/adding-book',
    {
      bookTitle: bookTitle || '',
      noneContentPage: true,
    },
  );
};

export const PostAddingBook = (
  req: Request,
  res: Response,
) => {
  const user = (req.user || {}) as UserType;
  const userId = user.id;
  const slug = convertToSlug(req.body.title || '');

  if (!userId || !slug) {
    return res.redirect('/login');
  }

  return Book.findOne({ slug })
    .exec()
    .then(currentBook => {
      let newSlug = slug;

      if (currentBook) {
        newSlug += '1'; // To make sure slug is unique
      }

      // Force verified to false
      const data = formatBookModel({
        ...req.body,
        verified: false,
        slug: newSlug,
        userId,
      });

      return new Book(data).save()
        .then((bookDoc: BookType) => {
          // Add user activity
          addUserActivityAPI(
            ACTIVITY_TYPE.BOOK_ADD_NEW,
            bookDoc.id,
            userId,
          ).then(userActivity => {
            logger('Added user activity ' + userActivity.id);
          });

          const message = encodeURIComponent(`Successfully added new book: ${bookDoc.title}.`);

          return res.redirect(`/${ENTITY.BOOK}/${bookDoc.slug}?success=true&message=${message}`);
        })
        .catch(err => {
          logger('Create book error: ' + err);
          const message = encodeURIComponent(`Adding new book error!!!`);

          return res.redirect(`/adding-book?error=true&message=${message}`);
        });
    });
};
