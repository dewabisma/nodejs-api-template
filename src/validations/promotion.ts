import * as yup from 'yup';
import { validBigIntTest, validLinkTest } from './helpers.js';

export const promotionValidation = yup.object({
  id: validBigIntTest.optional(),
  title: yup.string().max(1000).optional(),
  label: yup.string().max(1000).optional(),
  href: validLinkTest.optional(),
  cover: validLinkTest.required(),
  isActive: yup.boolean(),
});

export const updatePromotionValidation = yup.object({
  title: yup.string().max(1000).optional(),
  label: yup.string().max(1000).optional(),
  href: validLinkTest.optional(),
  cover: validLinkTest.optional(),
  isActive: yup.boolean(),
});
