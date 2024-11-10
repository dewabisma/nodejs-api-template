import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { articles } from '../models/articles.js';

export interface Article extends InferSelectModel<typeof articles> {}
export interface CreateArticle
  extends Optional<
    Omit<InferInsertModel<typeof articles>, 'createdAt' | 'updatedAt' | 'slug'>,
    'id'
  > {}
export interface UpdateArticle
  extends Omit<Partial<CreateArticle>, 'id' | 'tags'> {
  addedTags?: bigint[];
  removedTags?: bigint[];
}
