import express from 'express';

import * as perfume from '../controllers/perfume.js';
import * as perfumeReview from '../controllers/perfumeReview.js';
import * as perfumeNoteAlias from '../controllers/perfumeNoteAlias.js';

import { validateRequest } from '../middlewares/validateInput.js';

import type { CreatePerfume, UpdatePerfume } from '../interfaces/Perfume.js';
import {
  serializeQuery,
  serializeQueryOptions,
} from '../middlewares/serialize.js';
import {
  perfumeValidation,
  queryOptionsValidation,
  bodyIdsValidation,
  paramsIdValidation,
  perfumeReviewValidation,
  perfumeNameSearchValidation,
  updatePerfumeValidation,
  perfumeNoteAliasValidation,
  updatePerfumeReviewValidation,
  updatePerfumeNoteAliasValidation,
} from '../validations/index.js';
import type {
  CreatePerfumeReview,
  UpdatePerfumeReview,
} from '../interfaces/PerfumeReview.js';
import type {
  CreatePerfumeNoteAlias,
  UpdatePerfumeNoteAlias,
} from '../interfaces/PerfumeNoteAlias.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    perfume.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreatePerfume>('body', perfumeValidation),
    perfume.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    perfume.deleteMany,
  );

router
  .route('/discovery')
  .get(
    serializeQuery([{ key: 'noteIds', serializeFn: JSON.parse }]),
    serializeQueryOptions,
    validateRequest<{ name?: string; noteIds?: bigint[] }>(
      'query',
      perfumeNameSearchValidation,
    ),
    perfume.discoverPerfumes,
  );

router
  .route('/reviews')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    perfumeReview.query,
  )
  .post(
    isAuthenticated,
    validateRequest<Omit<CreatePerfumeReview, 'userId'>>(
      'body',
      perfumeReviewValidation,
    ),
    perfumeReview.create,
  )
  .delete(
    isAuthenticated,
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    perfumeReview.deleteMany,
  );

router
  .route('/note-aliases')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    perfumeNoteAlias.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreatePerfumeNoteAlias>('body', perfumeNoteAliasValidation),
    perfumeNoteAlias.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    perfumeNoteAlias.deleteMany,
  );

router
  .route('/reviews/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    perfumeReview.getById,
  )
  .put(
    isAuthenticated,
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdatePerfumeReview>('body', updatePerfumeReviewValidation),
    perfumeReview.update,
  );

router
  .route('/note-aliases/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    perfumeNoteAlias.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdatePerfumeNoteAlias>(
      'body',
      updatePerfumeNoteAliasValidation,
    ),
    perfumeNoteAlias.update,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    perfume.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdatePerfume>('body', updatePerfumeValidation),
    perfume.update,
  );

router
  .route('/:id/views')
  .put(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    perfume.incrementViewCount,
  );

export default router;
