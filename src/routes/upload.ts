import express from 'express';

import * as upload from '../controllers/upload.js';
import { validateRequest } from '../middlewares/validateInput.js';
import type {
  UploadOptions,
  UploadSearchBgOptions,
} from '../interfaces/Upload.js';
import {
  uploadOptionsValidation,
  uploadSearchBgOptionsValidation,
} from '../validations/index.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';
import { searchBgUploader } from '../middlewares/imageUploader.js';

const router = express.Router();

router.post(
  '/',
  isAuthenticated,
  isAuthorizedAs([UserRole.Admin]),
  validateRequest<UploadOptions>('query', uploadOptionsValidation),
  upload.uploadImages,
);

router.post(
  '/search-background',
  isAuthenticated,
  isAuthorizedAs([UserRole.Admin]),
  validateRequest<UploadSearchBgOptions>(
    'query',
    uploadSearchBgOptionsValidation,
  ),
  searchBgUploader,
  upload.uploadSearchBackgroundImages,
);

export default router;
