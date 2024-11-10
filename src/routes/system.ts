import express from 'express';

import * as system from '../controllers/system.js';
import { isAuthenticated, isAuthorizedAs } from '../middlewares/auth.js';
import { UserRole } from '../models/users.js';

const router = express.Router();

router.post(
  '/rebuild-website',
  isAuthenticated,
  isAuthorizedAs([UserRole.Admin]),
  system.rebuildWebsite,
);

export default router;
