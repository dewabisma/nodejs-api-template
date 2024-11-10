import * as yup from 'yup';
import { validBigIntTest, validLinkTest } from './helpers.js';

export const noteValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(100).required(),
  description: yup.string().min(1).required(),
  categoryId: validBigIntTest.required(),
  cover: validLinkTest.required(),
  icon: validLinkTest.required(),
});

export const updateNoteValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(100).optional(),
  description: yup.string().min(1).optional(),
  categoryId: validBigIntTest.optional(),
  cover: validLinkTest.optional(),
  icon: validLinkTest.optional(),
});
