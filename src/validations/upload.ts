import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const uploadOptionsValidation = yup.object({
  id: validBigIntTest.required(),
  category: yup
    .string()
    .oneOf([
      'brand',
      'perfume',
      'article',
      'note',
      'note-category',
      'promotion',
    ])
    .required(),
  prefix: yup.string(),
});

export const uploadSearchBgOptionsValidation = yup.object({
  order: yup.string().oneOf(['1', '2']).required(),
});
