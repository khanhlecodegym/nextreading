import { Router } from 'express';

// Middlewares
import { isAuthenticated } from '../../middlewares/passport';

// Helpers
import { saveToUploads } from '../../helpers/file';

// Controller
import {
  GetLogin,
  PostLogin,
  GetSignUp,
  PostSignUp,
  GetLogout,
  mdFacebookGet,
  mdFacebookCallback,
  mdGoogleGet,
  mdGoogleCallback,
  mdTwitterGet,
  mdTwitterCallback,
} from './authen';
import { HomeController } from './home';
import {
  SearchBookAPI,
  BookDetail,
  GetAddingBook,
  PostAddingBook,
  ToggleReadingBookAPI,
  ToggleWantToReadBookAPI,
} from './book';
import { AuthorDetail } from './author';
import { CategoryDetail } from './category';
import {
  UserDetail,
  GetUserSetting,
  PostUserSetting,
  UploadImageAPI,
  SearchUsernameAPI,
} from './user';
import {
  GetAboutUs,
  GetContact,
  GetPrivacyPolicy,
  GetTermsOfService
} from './static';

// API
import { RatingBookAPI } from './rating';
import { VoteReviewAPI } from './vote';
import {
  ReviewDetail,
  ReviewDetailByCounting,
  GetAddReview,
  PostAddReview,
} from './review';

export const clientRouter = Router()
  .get('/', (req, res) => HomeController(req, res))
  .get('/book/:slug', (req, res) => BookDetail(req, res))
  .get('/author/:slug', (req, res) => AuthorDetail(req, res))
  .get('/category/:slug', (req, res) => CategoryDetail(req, res))
  .get('/user/:username', (req, res) => UserDetail(req, res))
  .get('/review/:counting/:bookSlug', (req, res) => ReviewDetail(req, res))

  // AMP Pages
  .get('/amp', (req, res) => HomeController(req, res, true))
  .get('/amp/book/:slug', (req, res) => BookDetail(req, res, true))
  .get('/amp/author/:slug', (req, res) => AuthorDetail(req, res, true))
  .get('/amp/category/:slug', (req, res) => CategoryDetail(req, res, true))
  .get('/amp/user/:username', (req, res) => UserDetail(req, res, true))
  .get('/amp/review/:counting/:bookSlug', (req, res) => ReviewDetail(req, res, true))

  // Short link
  .get('/r/:counting', (req, res) => ReviewDetailByCounting(req, res))

  // API
  .get('/api/check-username', SearchUsernameAPI)
  .get('/api/search-book', SearchBookAPI)
  .post('/api/add-review', isAuthenticated, PostAddReview)
  .post('/api/rating-book', isAuthenticated, RatingBookAPI)
  .post('/api/book-current-reading', isAuthenticated, ToggleReadingBookAPI)
  .post('/api/book-want-to-read', isAuthenticated, ToggleWantToReadBookAPI)
  .post('/api/vote-review', isAuthenticated, VoteReviewAPI)
  .post(
    '/api/upload-image',
    [isAuthenticated, saveToUploads],
    UploadImageAPI,
  )

  // Authentication
  .get('/login', GetLogin)
  .post('/login', PostLogin)
  .get('/signup', GetSignUp)
  .post('/signup', PostSignUp)
  .get('/logout', GetLogout)
  .get('/auth/facebook', mdFacebookGet)
  .get('/auth/facebook/callback', mdFacebookCallback, (req, res) => res.redirect('/'))
  .get('/auth/google', mdGoogleGet)
  .get('/auth/google/callback', mdGoogleCallback, (req, res) => res.redirect('/'))
  .get('/auth/twitter', mdTwitterGet)
  .get('/auth/twitter/callback', mdTwitterCallback, (req, res) => res.redirect('/'))

  // Non-content pages
  .get('/add-review/:slug', GetAddReview)
  .get('/adding-book', GetAddingBook)
  .post('/adding-book', PostAddingBook)
  .get('/setting', GetUserSetting)
  .post('/setting', PostUserSetting)

  // License
  .get('/about', GetAboutUs)
  .get('/contact', GetContact)
  .get('/terms', GetTermsOfService)
  .get('/privacy', GetPrivacyPolicy)
  ;
