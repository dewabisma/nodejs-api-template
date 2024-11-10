import express from 'express';
import * as brand from '../controllers/brand.js';
import { validateRequest } from '../middlewares/validateInput.js';

import type { CreateBrand, UpdateBrand } from '../interfaces/Brand.js';
import { serializeQueryOptions } from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  brandValidation,
  paramsIdValidation,
  queryOptionsValidation,
  updateBrandValidation,
} from '../validations/index.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    brand.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreateBrand>('body', brandValidation),
    brand.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    brand.deleteMany,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    brand.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateBrand>('body', updateBrandValidation),
    brand.update,
  );

export default router;
