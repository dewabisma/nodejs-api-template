import express from 'express';
import * as promotion from '../controllers/promotion.js';
import { validateRequest } from '../middlewares/validateInput.js';
import type {
  CreatePromotion,
  UpdatePromotion,
} from '../interfaces/Promotion.js';
import { serializeQueryOptions } from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  promotionValidation,
  paramsIdValidation,
  queryOptionsValidation,
  updatePromotionValidation,
} from '../validations/index.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    promotion.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreatePromotion>('body', promotionValidation),
    promotion.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    promotion.deleteMany,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    promotion.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdatePromotion>('body', updatePromotionValidation),
    promotion.update,
  );

export default router;
