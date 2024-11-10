import express from 'express';

import * as search from '../controllers/search.js';

import { serializeQueryOptions } from '../middlewares/serialize.js';
import { validateRequest } from '../middlewares/validateInput.js';
import { omniSearchValidation } from '../validations/search.js';

const router = express.Router();

router.get(
  '/',
  serializeQueryOptions,
  validateRequest<{ keyword: string }>('query', omniSearchValidation),
  search.omniSearch,
);

export default router;
