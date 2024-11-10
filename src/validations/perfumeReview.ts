import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const perfumeReviewValidation = yup.object({
  perfumeId: validBigIntTest.required(),
  comment: yup.string().min(1).required(),
  rating: yup.number().min(1).max(5).required(),
});

export const updatePerfumeReviewValidation = yup.object({
  perfumeId: validBigIntTest.optional(),
  comment: yup.string().min(1).optional(),
  rating: yup.number().min(1).max(5).optional(),
});
