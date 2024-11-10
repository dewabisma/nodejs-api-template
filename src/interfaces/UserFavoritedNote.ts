import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { userFavoritedNotes } from '../models/users.js';

export interface UserFavoritedNote
  extends InferSelectModel<typeof userFavoritedNotes> {}
export interface CreateUserFavoritedNote
  extends Omit<
    InferInsertModel<typeof userFavoritedNotes>,
    'id' | 'createdAt' | 'updatedAt'
  > {}
export interface UpdateUserFavoritedNote
  extends Omit<Partial<CreateUserFavoritedNote>, 'id'> {}
