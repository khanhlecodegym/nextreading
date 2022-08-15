import { ENTITY } from './entity';

export enum ACTIVITY_TYPE {
  BOOK_ADD_NEW = 'BOOK_ADD_NEW',
  BOOK_RATING = 'BOOK_RATING',
  REVIEW_ADD_NEW = 'REVIEW_ADD_NEW',
  REVIEW_UP_VOTE = 'REVIEW_UP_VOTE',
  VERIFY_BOOK = 'VERIFY_BOOK',
  VERIFY_REVIEW = 'VERIFY_REVIEW',
}

export const ACTIVITY = {
  BOOK_ADD_NEW: {
    id: 'BOOK_ADD_NEW',
    entity: ENTITY.BOOK,
    name: 'Add book',
    value: 2,
  },
  BOOK_RATING: {
    id: 'BOOK_RATING',
    entity: ENTITY.BOOK,
    name: 'Rating book',
    value: 2,
  },
  REVIEW_ADD_NEW: {
    id: 'REVIEW_ADD_NEW',
    entity: ENTITY.REVIEW,
    name: 'Add review',
    value: 10,
  },
  REVIEW_UP_VOTE: {
    id: 'REVIEW_UP_VOTE',
    entity: ENTITY.REVIEW,
    name: 'Up vote review',
    value: 5,
  },
  VERIFY_BOOK: {
    id: 'VERIFY_BOOK',
    entity: ENTITY.BOOK,
    name: 'Verify book',
    value: 1,
  },
  VERIFY_REVIEW: {
    id: 'VERIFY_REVIEW',
    entity: ENTITY.REVIEW,
    name: 'Verify review',
    value: 1,
  },
};
