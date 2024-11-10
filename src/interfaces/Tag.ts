import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { tags } from '../models/articles.js';

export interface Tag extends InferSelectModel<typeof tags> {}
export interface CreateTag
  extends Optional<
    Omit<InferInsertModel<typeof tags>, 'createdAt' | 'updatedAt'>,
    'id'
  > {}
export interface UpdateTag extends Omit<Partial<CreateTag>, 'id'> {}
