import * as yup from 'yup';
import { validBigIntTest, validLinkTest } from './helpers.js';

export const brandValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(255).required(),
  banner: validLinkTest.optional(),
  logo: validLinkTest.optional(),
  description: yup.string(),
  website: validLinkTest.optional(),
  igUsername: yup.string().max(255),
});

export const updateBrandValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(255).optional(),
  banner: validLinkTest.optional(),
  logo: validLinkTest.optional(),
  description: yup.string(),
  website: validLinkTest.optional(),
  igUsername: yup.string().max(255),
});
