import * as yup from 'yup';
import { validBigIntTest } from './helpers.js';

export const userFavoritedNoteValidation = yup.object({
  noteId: validBigIntTest.required(),
});
