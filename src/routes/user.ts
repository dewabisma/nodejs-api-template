import express from 'express';

import * as user from '../controllers/user.js';
import * as userLikedPerfume from '../controllers/userLikedPerfume.js';
import * as userFavoritedNote from '../controllers/userFavoritedNote.js';
import * as note from '../controllers/note.js';

import { validateRequest } from '../middlewares/validateInput.js';

import type {
  UpdateUser,
  UserResetPassword,
  UserVerification,
} from '../interfaces/User.js';
import type { CreateUserFavoritedNote } from '../interfaces/UserFavoritedNote.js';
import type { CreateUserLikedPerfume } from '../interfaces/UserLikedPerfume.js';

import { serializeQueryOptions } from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  userValidation,
  paramsIdValidation,
  queryOptionsValidation,
  verifyUserValidation,
  userResetPasswordValidation,
  userFavoritedNoteValidation,
  userLikedPerfumeValidation,
} from '../validations/index.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    user.query,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    user.deleteMany,
  );

router
  .route('/self')
  .put(
    isAuthenticated,
    validateRequest<UpdateUser>('body', userValidation),
    user.updateSelf,
  )
  .delete(isAuthenticated, user.deleteSelf);

router.post(
  '/reset-password',
  validateRequest<UserResetPassword>('body', userResetPasswordValidation),
  user.passwordResetting,
);

router.get(
  '/verification',
  validateRequest<UserVerification>('query', verifyUserValidation),
  user.verification,
);

router
  .route('/liked-perfumes')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    userLikedPerfume.query,
  )
  .post(
    isAuthenticated,
    validateRequest<Omit<CreateUserLikedPerfume, 'userId'>>(
      'body',
      userLikedPerfumeValidation,
    ),
    userLikedPerfume.create,
  )
  .delete(
    isAuthenticated,
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    userLikedPerfume.deleteMany,
  );

router
  .route('/favorited-notes')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    userFavoritedNote.query,
  )
  .post(
    isAuthenticated,
    validateRequest<Omit<CreateUserFavoritedNote, 'userId'>>(
      'body',
      userFavoritedNoteValidation,
    ),
    userFavoritedNote.create,
  )
  .delete(
    isAuthenticated,
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    userFavoritedNote.deleteMany,
  );

router
  .route('/not-favorited-notes')
  .get(
    isAuthenticated,
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    note.queryNotFavoritedByUser,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    user.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateUser>('body', userValidation),
    user.update,
  );

export default router;
