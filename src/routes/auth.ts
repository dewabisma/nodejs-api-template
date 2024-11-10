import express from 'express';
import * as auth from '../controllers/auth.js';
import { validateRequest } from '../middlewares/validateInput.js';
import type { UserLoginInput, CreateUser } from '../interfaces/User.js';
import {
  loginValidation,
  oauthValidation,
  registerValidation,
  requestAccountVerificationValidation,
  requestPasswordResetValidation,
} from '../validations/index.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import passport from 'passport';

import env from '../config/index.js';

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  validateRequest<UserLoginInput>('body', loginValidation),
  auth.login,
);
router.get('/logout', isAuthenticated, auth.logout);
router.get('/check', isAuthenticated, auth.checkAuthentication);
router.post(
  '/register',
  authLimiter,
  validateRequest<CreateUser>('body', registerValidation),
  auth.register,
);
router.get(
  '/request/password-reset',
  validateRequest<{ email: string }>('query', requestPasswordResetValidation),
  auth.requestPasswordReset,
);
router.get(
  '/request/account-verification',
  validateRequest<{ email: string }>(
    'query',
    requestAccountVerificationValidation,
  ),
  auth.resendVerificationToken,
);

// OAuth
router.get(
  '/oauth-validation',
  validateRequest<{ token: string }>('query', oauthValidation),
  auth.validateOAuthToken,
);

// Google OAuth 2.0
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }),
);
router.get(
  '/google/redirect',
  passport.authenticate('google', {
    failureRedirect: `${env.webBaseUrl}`,
    session: false,
  }),
  auth.handleOAuth,
);

export default router;
