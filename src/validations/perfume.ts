import * as yup from 'yup';
import { Gender, Occasion, PerfumeType } from '../models/perfumes.js';
import {
  createEnumTest,
  validBigIntTest,
  validDateTest,
  validLinkTest,
} from './index.js';

const perfumeNoteValidation = yup.array().of(
  yup
    .object({
      noteId: validBigIntTest.defined(),
      alias: yup.string().min(1).max(100).optional(),
    })
    .defined(),
);

export const perfumeValidation = yup.object({
  id: validBigIntTest.optional(),
  name: yup.string().min(1).max(255).required(),
  description: yup.string().min(1).required(),
  gender: createEnumTest(Gender).required(),
  price: yup.number().min(1).max(5),
  releaseDate: validDateTest,
  variants: yup
    .array()
    .of(
      yup
        .object({
          label: yup.string().min(1).required(),
          thumbnail: validLinkTest.required(),
        })
        .required(),
    )
    .required(),
  brandId: validBigIntTest.optional(),
  baseNotes: perfumeNoteValidation.optional(),
  middleNotes: perfumeNoteValidation.optional(),
  topNotes: perfumeNoteValidation.optional(),
  uncategorizedNotes: perfumeNoteValidation.optional(),
  type: createEnumTest(PerfumeType).required(),
  occasion: createEnumTest(Occasion).required(),
  isHalal: yup.boolean(),
  isBpomCertified: yup.boolean(),
  isFeatured: yup.boolean(),
});

export const updatePerfumeValidation = yup.object({
  name: yup.string().min(1).max(255),
  description: yup.string().min(1),
  gender: createEnumTest(Gender),
  price: yup.number().min(1).max(5),
  releaseDate: validDateTest,
  variants: yup.array().of(
    yup
      .object({
        label: yup.string().min(1).required(),
        thumbnail: validLinkTest.required(),
      })
      .required(),
  ),
  brandId: validBigIntTest.optional(),
  addedBaseNotes: perfumeNoteValidation.optional(),
  addedMiddleNotes: perfumeNoteValidation.optional(),
  addedTopNotes: perfumeNoteValidation.optional(),
  addedUncategorizedNotes: perfumeNoteValidation.optional(),
  removedBaseNotes: yup.array().of(validBigIntTest.defined()).optional(),
  removedMiddleNotes: yup.array().of(validBigIntTest.defined()).optional(),
  removedTopNotes: yup.array().of(validBigIntTest.defined()).optional(),
  removedUncategorizedNotes: yup
    .array()
    .of(validBigIntTest.defined())
    .optional(),
  type: createEnumTest(PerfumeType),
  occasion: createEnumTest(Occasion),
  isHalal: yup.boolean(),
  isBpomCertified: yup.boolean(),
  isFeatured: yup.boolean(),
});

export const perfumeNameSearchValidation = yup.object({
  name: yup.string().min(1).max(255).optional(),
  noteIds: yup.array().of(validBigIntTest.defined()).optional(),
});
