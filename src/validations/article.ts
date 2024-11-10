import * as yup from 'yup';
import { createEnumTest, validBigIntTest, validLinkTest } from './helpers.js';
import { ArticleStatus, ArticleType } from '../models/articles.js';

export const articleValidation = yup.object({
  id: validBigIntTest.optional(),
  brandId: validBigIntTest.optional(),
  metaKeywords: yup.string(),
  metaDescription: yup.string(),
  title: yup.string().max(1000).required(),
  author: yup.string().max(255).required(),
  imageBy: yup.string().max(255).required(),
  cover: validLinkTest,
  banner: validLinkTest,
  tags: yup.array().of(validBigIntTest.defined()).optional(),
  content: yup.string().required(),
  isFeatured: yup.boolean(),
  type: createEnumTest(ArticleType).required(),
  status: createEnumTest(ArticleStatus),
});

export const updateArticleValidation = yup.object({
  brandId: validBigIntTest.optional(),
  metaKeywords: yup.string(),
  metaDescription: yup.string(),
  title: yup.string().max(1000),
  author: yup.string().max(255),
  imageBy: yup.string().max(255),
  cover: validLinkTest,
  banner: validLinkTest,
  addedTags: yup.array().of(validBigIntTest.defined()).optional(),
  removedTags: yup.array().of(validBigIntTest.defined()).optional(),
  content: yup.string(),
  isFeatured: yup.boolean(),
  type: createEnumTest(ArticleType),
  status: createEnumTest(ArticleStatus),
});
