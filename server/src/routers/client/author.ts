import { Request, Response } from 'express';

// Helpers
import { getUserSettings } from './_helpers';
import { logger } from '../../helpers/logger';
import { convertToSlug } from '../../helpers/ulti';

// Models
import { Book } from '../../models/book.model';
import { Author } from '../../models/author.model';

export const SearchAuthorAPI = (
  req: Request,
  res: Response,
) => {
  const query = req.query.query as string;
  const querySlug = convertToSlug(query);
  const formatQuery = {
    slug: new RegExp(querySlug, 'i'),
  };

  return Author.find(formatQuery)
    .select('id name slug img')
    .limit(10)
    .exec()
    .then(data => {
      return res.json({
        success: true,
        authors: data,
      });
    })
    .catch(err => res.status(501).json({ success: false }));
};

export const AuthorDetail = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  const { slug } = req.params;

  return Author.findOne({ slug })
    .exec()
    .then(author => {
      if (!author) {
        logger('Not found author: ' + slug);
        return res.redirect(`/`);
      }

      return Book
        .find({ authorId: author.id })
        .exec()
        .then(books => {
          return res.render(
            isAMP ? 'client/amp/author' : 'client/author',
            {
              author,
              books,
              isAuthorPage: true,
              setting: getUserSettings(req),
            },
          );
        });
    });
};
