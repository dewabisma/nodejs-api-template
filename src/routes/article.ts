import express from 'express';

import * as article from '../controllers/article.js';
import * as tag from '../controllers/tag.js';

import { validateRequest } from '../middlewares/validateInput.js';
import type { CreateArticle, UpdateArticle } from '../interfaces/Article.js';
import { serializeQueryOptions } from '../middlewares/serialize.js';
import {
  bodyIdsValidation,
  articleValidation,
  paramsIdValidation,
  queryOptionsValidation,
  updateArticleValidation,
  tagValidation,
  updateTagValidation,
} from '../validations/index.js';
import type { CreateTag, UpdateTag } from '../interfaces/Tag.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router
  .route('/')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    article.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreateArticle>('body', articleValidation),
    article.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    article.deleteMany,
  );

router
  .route('/tags')
  .get(
    serializeQueryOptions,
    validateRequest<DB.QueryOptions>('query', queryOptionsValidation),
    tag.query,
  )
  .post(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<CreateTag>('body', tagValidation),
    tag.create,
  )
  .delete(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ ids: bigint[] }>('body', bodyIdsValidation),
    tag.deleteMany,
  );

router
  .route('/tags/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    tag.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateTag>('body', updateTagValidation),
    tag.update,
  );

router
  .route('/:id')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    article.getById,
  )
  .put(
    isAuthenticated,
    isAuthorizedAs([UserRole.Admin]),
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    validateRequest<UpdateArticle>('body', updateArticleValidation),
    article.update,
  );

router
  .route('/:id/related')
  .get(
    validateRequest<{ id: bigint }>('params', paramsIdValidation),
    serializeQueryOptions,
    article.queryRelatedArticles,
  );

export default router;
