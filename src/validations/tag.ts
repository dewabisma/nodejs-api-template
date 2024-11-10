import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const tagValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(255).required(),
});

export const updateTagValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(255).optional(),
});
