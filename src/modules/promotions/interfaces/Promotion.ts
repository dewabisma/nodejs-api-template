import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { promotions } from '../models/promotions.js';

export interface Promotion extends InferSelectModel<typeof promotions> {}
export interface CreatePromotion
  extends Optional<
    Omit<InferInsertModel<typeof promotions>, 'createdAt' | 'updatedAt'>,
    'id'
  > {}
export interface UpdatePromotion extends Omit<Partial<CreatePromotion>, 'id'> {}
