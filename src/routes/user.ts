import express from 'express';

import * as user from '../controllers/user.js';

import { validateRequest } from '../middlewares/validateInput.js';

import type {
  UpdateUser,
  UserResetPassword,
  UserVerification,
} from '../interfaces/User.js';

import { serializeQueryOptions } from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  userValidation,
  paramsIdValidation,
  queryOptionsValidation,
  verifyUserValidation,
  userResetPasswordValidation,
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
