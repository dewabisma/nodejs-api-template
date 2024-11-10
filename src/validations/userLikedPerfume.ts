import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const userLikedPerfumeValidation = yup.object({
  perfumeId: validBigIntTest.required(),
});
