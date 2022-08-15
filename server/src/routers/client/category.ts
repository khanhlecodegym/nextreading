import { Request, Response } from 'express';

// Helpers
import { logger } from '../../helpers/logger';

// Models
import { Category } from '../../models/category.model';

export const CategoryDetail = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  const { slug } = req.params;

  return Category.findOne({ slug })
    .exec()
    .then(category => {
      if (!category) {
        logger('Not found category: ' + slug);
        return res.redirect(`/`);
      }

      // TODO: Find all books belong to Category
      return res.render(
        isAMP ? 'client/amp/category' : 'client/category',
        {
          category,
          books: [],
        },
      );
    });
};
