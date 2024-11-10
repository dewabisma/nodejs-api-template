import express from 'express';

import * as contactUs from '../controllers/contactUs.js';

import { validateRequest } from '../middlewares/validateInput.js';
import { contactUsValidation } from '../validations/index.js';
import type { ContactUsPayload } from '../interfaces/ContactUs.js';

const router = express.Router();

router
  .route('/')
  .post(
    validateRequest<ContactUsPayload>('body', contactUsValidation),
    contactUs.forwardContactUsMessage,
  );

export default router;
