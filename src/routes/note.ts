import express from 'express';

import * as note from '../controllers/note.js';
import * as noteCategory from '../controllers/noteCategory.js';

import { validateRequest } from '../middlewares/validateInput.js';
import type { CreateNote, UpdateNote } from '../interfaces/Note.js';
import {
  serializeQuery,
  serializeQueryOptions,
} from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  noteCategoryValidation,
  noteValidation,
  paramsIdValidation,
  queryOptionsValidation,
  randomizedQueryValidation,
  updateNoteCategoryValidation,
  updateNoteValidation,
} from '../validations/index.js';
import type {
  CreateNoteCategory,
  UpdateNoteCategory,
} from '../interfaces/NoteCategory.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    note.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreateNote>('body', noteValidation),
    note.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    note.deleteMany,
  );

router
  .route('/categories')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    noteCategory.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreateNoteCategory>('body', noteCategoryValidation),
    noteCategory.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    noteCategory.deleteMany,
  );

router.get(
  '/categories/random',
  serializeQuery([{ key: 'amount', serializeFn: Number }]),
  validateRequest<{ amount?: number }>('query', randomizedQueryValidation),
  noteCategory.getRandomRecords,
);

router
  .route('/categories/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    noteCategory.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateNoteCategory>('body', updateNoteCategoryValidation),
    noteCategory.update,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    note.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateNote>('body', updateNoteValidation),
    note.update,
  );

router
  .route('/:id/related-perfumes')
  .get(
    serializeQueryOptions,
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    note.queryRelatedPerfumes,
  );

export default router;
