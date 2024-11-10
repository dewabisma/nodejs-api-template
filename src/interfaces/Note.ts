import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { notes } from '../models/notes.js';

export interface Note extends InferSelectModel<typeof notes> {}
export interface CreateNote
  extends Optional<
    Omit<
      InferInsertModel<typeof notes>,
      'createdAt' | 'updatedAt' | 'popularityCount'
    >,
    'id'
  > {}
export interface UpdateNote extends Omit<Partial<CreateNote>, 'id'> {}
