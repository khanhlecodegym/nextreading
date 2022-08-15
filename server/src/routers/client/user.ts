import { Request, Response } from 'express';

// Helpers
import { getUserSettings } from './_helpers';
import { formatCommonModel } from '../../helpers/format';
import { logger } from '../../helpers/logger';
import { uploadImageAPI } from '../../helpers/api';

// Models
import { User, UserType } from '../../models/user.model';
import { Book } from '../../models/book.model';
import { Rating } from '../../models/rating.model';

export const UploadImageAPI = (
  req: Request,
  res: Response,
) => {
  const { id, entity } = req.body;
  const imgFile = (req as any).file;

  return uploadImageAPI(entity, id, imgFile.originalname)
    .then((imgUrl: string) => {
      logger(`succeed imgUrl: ${imgUrl}`);
      return res.json({ success: true, imgUrl });
    })
    .catch(err => {
      logger(`Upload ${entity} image error: ' ${err.message}`);

      return res.status(502).json({
        success: false,
        message: err.message,
      });
    });
};

// Check duplicate username
export const SearchUsernameAPI = (
  req: Request,
  res: Response,
) => {
  const username = req.query.query as string;

  return User.findOne({ username })
    .exec()
    .then(user => res.json({ duplicate: !!user }))
    .catch(err => res.status(501).json({ success: false }));
};

export const UserDetail = (
  req: Request,
  res: Response,
  isAMP: boolean = false,
) => {
  const { username } = req.params;

  return User.findOne({ username })
    .exec()
    .then(user => {
      if (!user) {
        logger('Not found User: ' + username);
        return res.redirect(`/`);
      }

      return Promise.all([
        Rating.find({
            userId: user.id,
            finishDate: { $ne: null },
          })
          .sort({ finishDate: -1 })
          .populate({
            path: 'bookId',
            select: 'id title slug img',
          })
          .exec(),

        Book.find({ _id: { $in: user.currentReading } })
          .select('id title slug img')
          .limit(6)
          .exec(),
      ])
      .then(data => {
        const ratings = data[0];
        const currentReading = data[1];

        return res.render(
          isAMP ? 'client/amp/user' : 'client/user',
          {
            userProfile: user,
            ratings,
            currentReading,
            isUserPage: true,
            setting: getUserSettings(req),
          },
        );
      });
    });
};

export const PostUserSetting = (
  req: Request,
  res: Response,
) => {
  const reqUser = (req.user || {}) as UserType;
  const userId = reqUser.id;
  const userData = {...formatCommonModel(req.body)};

  if (!reqUser) {
    return res.redirect('/login');
  }

  return User.findOne({ username: userData.username })
    .exec()
    .then(user => {
      if (user && user.id !== reqUser.id) {
        console.log('diff user but duplicated username, go redirect');
        return res.redirect('/setting');
      }

      const { role, ...userUpdate } = userData;

      return User.findByIdAndUpdate(userId, userUpdate)
      .then(() => {
        const message = encodeURIComponent(`Successfully updated user setting.`);

        return res.redirect(`/setting?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating user setting error!!!`);

        return res.redirect(`/setting?success=true&message=${message}`);
      });
    });
};

export const GetUserSetting = (
  req: Request,
  res: Response,
) => {
  const reqUser = req.user as UserType;

  if (!reqUser) {
    return res.redirect('/login');
  }

  return User.findById(reqUser.id)
    .exec()
    .then(user => {
      if (!user) {
        logger('Not found User: ' + reqUser.id);
        return res.redirect(`/login`);
      }

      return res.render(
        'client/none-content/user-setting',
        {
          user,
          setting: getUserSettings(req),
        },
      );
    });
};
