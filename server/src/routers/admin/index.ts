import { Router } from 'express';

// Middleware
import {
  isAdminGroup,
  isModeratorGroup,
  isEditorGroup,
} from '../../middlewares/permission';

// Editor Group
import { dashboardRouter } from './dashboard';
import { apiRouter } from './api';
import { bookRouter } from './book';
import { reviewRouter } from './review';
import { authorRouter } from './author';

// Moderator Group
import { badgeRouter } from './badge';
import { userBadgeRouter } from './userbadge';
import { userActivityRouter } from './user-activity';
import { voteRouter } from './vote';
import { ratingRouter } from './rating';

// Admin Group
import { categoryRouter } from './category';
import { reportRouter } from './report';
import { affiliateRouter } from './affiliate';
import { userRouter } from './user';
import { scrapingUrlRouter } from './scraping-url';
import { scrapingContentRouter } from './scraping-content';
import { cleanRouter } from './_clean';

export const adminRouter = Router()
  .use('/', isEditorGroup, dashboardRouter)
  .use('/api', isEditorGroup, apiRouter)
  .use('/book', isEditorGroup, bookRouter)
  .use('/review', isEditorGroup, reviewRouter)
  .use('/author', isEditorGroup, authorRouter)
  .use('/badge', isModeratorGroup, badgeRouter)
  .use('/userbadge', isModeratorGroup, userBadgeRouter)
  .use('/vote', isModeratorGroup, voteRouter)
  .use('/rating', isModeratorGroup, ratingRouter)

  // Admin Group
  .use('/user-activity', isAdminGroup, userActivityRouter)
  .use('/category', isAdminGroup, categoryRouter)
  .use('/report', isAdminGroup, reportRouter)
  .use('/affiliate', isAdminGroup, affiliateRouter)
  .use('/user', isAdminGroup, userRouter)
  .use('/scraping-url', isAdminGroup, scrapingUrlRouter)
  .use('/scraping-content', isAdminGroup, scrapingContentRouter)
  .use('/clean', isAdminGroup, cleanRouter);
