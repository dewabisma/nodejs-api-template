import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { perfumeReviews } from '../models/perfumes.js';

export interface PerfumeReview
  extends InferSelectModel<typeof perfumeReviews> {}
export interface CreatePerfumeReview
  extends Omit<
    InferInsertModel<typeof perfumeReviews>,
    'id' | 'createdAt' | 'updatedAt'
  > {}
export interface UpdatePerfumeReview
  extends Omit<Partial<CreatePerfumeReview>, 'id' | 'userId'> {}
