import { Router } from 'express';

// Helpers
import { DEFAULT_QUERY_LIMIT, TYPEAHEAD_QUERY_LIMIT } from '../../../constants/db';
import { ENTITY } from '../../../constants/entity';
import { getFlashMessage, convertToSlug } from '../../../helpers/ulti';
import { logger } from '../../../helpers/logger';
import { formatCommonModel } from '../../../helpers/format';

// Model
import {
  ListingHeaderTypes,
  ListingReqQueryPayload,
} from '../../../models/base.model';
import {
  User,
  UserType,
  ACCOUNT_TYPE,
  ACCOUNT_TYPE_ARRAY,
} from '../../../models/user.model';
import { ACCOUNT_GENDER_ARRAY } from '../../../constants/gender';

export const getTypeaheadUserAPI = (query: string) => {
  const queryRegEx = new RegExp(convertToSlug(query), 'i');

  return User.find({
      $or: [
        { username: queryRegEx },
        { email: queryRegEx },
      ],
    })
    .sort('email')
    .limit(TYPEAHEAD_QUERY_LIMIT)
    .exec()
    .then((data: UserType[]) => {
      return data.map(({ id, username, email }) => ({
        id,
        name: `${email}${username ? ` [${username}]` : ''}`,
      }));
    });
};

export const userRouter = Router()
  .get('/', (req, res) => {
    const flashMessage = getFlashMessage(req.query);
    const {
      query = '',
      page = 1,
    } = req.query as ListingReqQueryPayload;
    let formatQuery = {};
    const queryRegEx = new RegExp(convertToSlug(query), 'i');

    // Listing Columns
    const headers: ListingHeaderTypes[] = [
      { name: 'Email', field: 'email' },
      { name: 'Username', field: 'username' },
      { name: 'Name', field: 'name' },
      { name: 'Permission', field: 'role' },
      { name: 'Score', field: 'score' },
      { name: 'Operator', field: '_' },
    ];

    if (query) {
      formatQuery = { $or: [
        { username: queryRegEx },
        { email: queryRegEx },
      ]};
    }

    return User.find(formatQuery)
      .sort('role')
      .limit(DEFAULT_QUERY_LIMIT)
      .skip(DEFAULT_QUERY_LIMIT * (page - 1))
      .exec()
      .then(data => {
        const formatData = data.map(({ id, email, username, name, role, score }) => ({
          id,
          email,
          username,
          name,
          role: ACCOUNT_TYPE[role],
          score,
        }));

        return res.render(
          'admin/common/listing',
          {
            title: 'User Listing Page',
            entity: ENTITY.USER,
            query,
            page: Number(page),
            data: formatData,
            headers,
            ...flashMessage,
          },
        );
      });
  })
  .get('/create', (req, res) => {
    res.render(
      'admin/user/update',
      {
        title: 'Create New User',
        entity: ENTITY.USER,
        accountTypes: ACCOUNT_TYPE_ARRAY,
        accountGenders: ACCOUNT_GENDER_ARRAY,
        data: {},
      },
    );
  })
  .get('/:id', (req, res) => {
    const { id } = req.params;
    const flashMessage = getFlashMessage(req.query);

    return User.findById(id)
      .then((data: UserType) => {
        if (!data) {
          const message = encodeURIComponent(`Wrong User ID!!!`);

          return res.redirect(`/admin/${ENTITY.USER}/?error=true&message=${message}`);
        }

        return res.render(
          'admin/user/update',
          {
            title: `User Detail: ${data.email}`,
            data,
            entity: ENTITY.USER,
            accountTypes: ACCOUNT_TYPE_ARRAY,
            accountGenders: ACCOUNT_GENDER_ARRAY,
            ...flashMessage,
          },
        );
      })
      .catch(err => {
        const message = encodeURIComponent(`Wrong User ID!!!`);
        logger(message + ' - Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.USER}/?error=true&message=${message}`);
      });
  })
  .post('/create', (req, res) => {
    return new User(formatCommonModel(req.body)).save()
      .then(user => {
        const message = encodeURIComponent(`Successfully added new user id: ${user.id}.`);

        return res.redirect(`/admin/${ENTITY.USER}/${user.id}/?success=true&message=${message}`);
      })
      .catch(err => {
        const message = encodeURIComponent(`Adding new user error!!!`);
        logger(message + 'Detail: ' + err.message);

        return res.redirect(`/admin/${ENTITY.USER}/?error=true&message=${message}`);
      });
  })
  .post('/update', (req, res) => {
    const userId = req.body.id;

    return User.findByIdAndUpdate(userId, {
      ...formatCommonModel(req.body),
    })
      .then(() => {
        const message = encodeURIComponent(`Successfully updated user id: ${userId}.`);

        return res.redirect(`/admin/${ENTITY.USER}/${userId}/?success=true&message=${message}`);
      }).catch(() => {
        const message = encodeURIComponent(`Updating user id: ${userId} error!!!`);

        return res.redirect(`/admin/${ENTITY.USER}/${userId}/?error=true&message=${message}`);
      });
  })
  .get('/:id/delete', (req, res) => {
    const { id } = req.params;

    // TODO: Remove related data
    return User.findByIdAndRemove(id)
      .then(() => {
        const message = encodeURIComponent(`Successfully deleted user id: ${id}.`);
        return res.redirect(`/admin/${ENTITY.USER}/?success=true&message=${message}`);
      })
      .catch(err => {
        logger('Delete User error: ' + err);
        const message = encodeURIComponent(`Removing user error!!!`);

        return res.redirect(`/admin/${ENTITY.USER}/?error=true&message=${message}`);
      });
  })
  ;
