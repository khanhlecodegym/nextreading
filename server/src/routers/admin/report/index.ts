import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT } from '../../../constants/db';
import {
  isEmptyObj,
  getFlashMessage,
  getDayStr,
} from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import { Book } from '../../../models/book.model';
import { Review } from '../../../models/review.model';
import { User, UserType } from '../../../models/user.model';

const date = new Date();
const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

const headers: ListingHeaderTypes[] = [
  { name: 'Slug', field: 'slug', url: true },
  { name: 'Created At', field: 'createdAt' },
  { name: 'Created By', field: 'email' },
];

const getBooks = (
  startDate: string = firstDay.toString(),
  endDate: string = lastDay.toString(),
  page: number = 1,
  userId: string = '',
) => {
  const startTime = (new Date(new Date(startDate).getTime())).toString();
  const endTime = (new Date(new Date(endDate).getTime())).toString();

  return Book.find({
    createdAt: {
      $gte: startTime,
      $lt: endTime,
    },
  })
  .select('id slug createdAt')
  .sort({ createdAt: -1 })
  .limit(DEFAULT_QUERY_LIMIT)
  .skip(DEFAULT_QUERY_LIMIT * (page - 1))
  .populate({
    path: 'userId',
    match: { _id: userId },
    select: 'id username email',
  })
  .then(data => {
    return data
      .filter(it => it.userId)
      .map(it => ({
        id: `/book/${it.id}`,
        slug: `/book/${it.slug}`,
        createdAt: getDayStr(it.createdAt),
        userId: (it.userId as any as UserType).id,
        email: (it.userId as any as UserType).email,
      }));
  });
};

export const reportRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);

    return Promise.all([
      Book.countDocuments().exec(),
      Review.countDocuments().exec(),
      User.countDocuments().exec(),
    ]).then(data => {
      const columns = [
        { name: 'Book', field: 'totalBooks', bgClass: 'bg-primary' },
        { name: 'Review', field: 'totalReviews', bgClass: 'bg-success' },
        { name: 'User', field: 'totalUsers', bgClass: 'bg-info' },
      ];

      return res.render(
        'admin/report/index',
        {
          title: `Site Stats`,
          columns,
          data: {
            totalBooks: data[0],
            totalReviews: data[1],
            totalUsers: data[2],
          },
        },
      );
    });
  })
  .get('/book', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      type = 'book',
      page = 1,
      startDate = getDayStr(firstDay.toString()),
      endDate = getDayStr(lastDay.toString()),
    } = req.query as ListingReqQueryPayload;

    if (isEmptyObj(req.query)) {
      return res.redirect(`/admin/report/?type=${type}&startDate=${startDate}&endDate=${endDate}&page=${page}`);
    }

    return getBooks(startDate, endDate, page).then(data => {
      return res.render(
        'admin/report/listing',
        {
          title: `Books Reports`,
          page: Number(page),
          data,
          type,
          startDate,
          endDate,
          headers,
          ...flashMessage,
        },
      );
    });
  })
  .get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    const flashMessage = getFlashMessage(req.query);
    const {
      type = 'user',
      page = 1,
      startDate = getDayStr(firstDay.toString()),
      endDate = getDayStr(lastDay.toString()),
    } = req.query as ListingReqQueryPayload;

    if (isEmptyObj(req.query)) {
      return res.redirect(`/admin/report/user/${userId}?type=${type}&startDate=${startDate}&endDate=${endDate}&page=${page}`);
    }

    return getBooks(startDate, endDate, page, userId).then(data => {
      return res.render(
        'admin/report/listing',
        {
          title: `Books by User Reports`,
          page: Number(page),
          data,
          type,
          startDate,
          endDate,
          headers,
          ...flashMessage,
        },
      );
    });
  })
  .get('/new-book-urls', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const NUMBER_OF_DAYS = 7;
    const last7Days = (new Date(new Date().getTime() - NUMBER_OF_DAYS * 60 * 60 * 24 * 1000)).toString();

    // Listing Columns
    const headers2: ListingHeaderTypes[] = [
      { name: 'Slug', field: 'slug', url: true },
      { name: 'Created At', field: 'createdAt' },
      { name: 'Operator', field: '_' },
    ];

    return Book.find({
      createdAt: {
        $gte: last7Days,
      },
    })
    .select('id slug createdAt')
    .sort({ createdAt: -1 })
    .then(data => {
      const formatData = data.map(it => ({
        slug: `/book/${it.slug}`,
        createdAt: getDayStr(it.createdAt),
      }));

      return res.render(
        'admin/common/listing',
        {
          title: `New Book Urls`,
          headers,
          data: formatData,
          ...flashMessage,
        },
      );
    })
    .catch(err => {
      logger('Get new Book urls error: ' + err);
      const message = encodeURIComponent(`Get new Book urls error!!!`);

      return res.redirect(`/admin/report/new-book-urls/?error=true&message=${message}`);
    });
  })
  ;
