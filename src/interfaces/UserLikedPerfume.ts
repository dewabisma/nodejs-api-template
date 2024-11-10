import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { userLikedPerfumes } from '../models/users.js';

export interface UserLikedPerfume
  extends InferSelectModel<typeof userLikedPerfumes> {}
export interface CreateUserLikedPerfume
  extends Omit<
    InferInsertModel<typeof userLikedPerfumes>,
    'id' | 'createdAt' | 'updatedAt'
  > {}
export interface UpdateUserLikedPerfume
  extends Omit<Partial<CreateUserLikedPerfume>, 'id'> {}
