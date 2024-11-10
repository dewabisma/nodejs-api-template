import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { brands } from '../models/brands.js';

export interface Brand extends InferSelectModel<typeof brands> {}
export interface CreateBrand
  extends Optional<
    Omit<InferInsertModel<typeof brands>, 'createdAt' | 'updatedAt'>,
    'id'
  > {}
export interface UpdateBrand extends Omit<Partial<CreateBrand>, 'id'> {}
