import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { perfumeNoteAliases } from '../models/perfumes.js';

export interface PerfumeNoteAlias
  extends InferSelectModel<typeof perfumeNoteAliases> {}
export interface CreatePerfumeNoteAlias
  extends Omit<
    InferInsertModel<typeof perfumeNoteAliases>,
    'id' | 'createdAt' | 'updatedAt'
  > {}
export interface UpdatePerfumeNoteAlias
  extends Omit<Partial<CreatePerfumeNoteAlias>, 'id'> {}
