// Helpers
import { uploadImage } from './file';
import { logger } from './logger';

// Models
import { ENTITY } from '../constants/entity';
import { Book } from '../models/book.model';
import { Author } from '../models/author.model';
import { User } from '../models/user.model';

export const uploadImageAPI = (
  entity,
  id: string,
  originalName,
) => {
  return uploadImage(entity, id, originalName)
    .then((imgUrl: string) => {
      switch (entity) {
        case ENTITY.BOOK:
          Book.findByIdAndUpdate(id, { img: imgUrl })
            .exec()
            .catch(err => logger(`Update ${entity} image error: ', ${err}`));
          break;
        case ENTITY.AUTHOR:
          Author.findByIdAndUpdate(id, { img: imgUrl })
            .exec()
            .catch(err => logger(`Update ${entity} image error: ', ${err}`));
          break;
        case ENTITY.USER:
          User.findByIdAndUpdate(id, { img: imgUrl })
            .exec()
            .catch(err => logger(`Update ${entity} image error: ', ${err}`));
          break;
      }

      return imgUrl;
    })
    .catch(err => {
      logger(`upload err: ${err.message}`);
      throw new Error(err.message);
    });
};

export const checkDuplicatedSlug = (
  type: ENTITY,
  slug: string,
) => {
  if (type === ENTITY.BOOK) {
    return Book.findOne({ slug })
      .exec()
      .then(book => !!book);
  }

  if (type === ENTITY.AUTHOR) {
    return Author.findOne({ slug })
      .exec()
      .then(author => !!author);
  }

  return Promise.all([]).then(() => true);
};
