import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const perfumeNoteAliasValidation = yup.object({
  perfumeId: validBigIntTest.required(),
  noteId: validBigIntTest.required(),
  noteAlias: yup.string().min(1).max(100).required(),
});

export const updatePerfumeNoteAliasValidation = yup.object({
  perfumeId: validBigIntTest.optional(),
  noteId: validBigIntTest.optional(),
  noteAlias: yup.string().min(1).max(100).optional(),
});
