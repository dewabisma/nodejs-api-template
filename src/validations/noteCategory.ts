import * as yup from 'yup';
import { validBigIntTest, validLinkTest } from './helpers.js';

export const noteCategoryValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(100).required(),
  description: yup.string().min(1).required(),
  cover: validLinkTest.required(),
  color: yup
    .string()
    .min(3)
    .max(8)
    .matches(/^(?:[0-9a-fA-F]{3,4}){1,2}$/)
    .required(),
  shade: yup
    .string()
    .min(3)
    .max(8)
    .matches(/^(?:[0-9a-fA-F]{3,4}){1,2}$/)
    .required(),
});

export const updateNoteCategoryValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(100).optional(),
  description: yup.string().min(1).optional(),
  cover: validLinkTest.optional(),
  color: yup
    .string()
    .min(3)
    .max(8)
    .matches(/^(?:[0-9a-fA-F]{3,4}){1,2}$/)
    .optional(),
  shade: yup
    .string()
    .min(3)
    .max(8)
    .matches(/^(?:[0-9a-fA-F]{3,4}){1,2}$/)
    .optional(),
});
