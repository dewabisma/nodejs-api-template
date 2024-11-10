import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { noteCategories } from '../models/notes.js';

export interface NoteCategory extends InferSelectModel<typeof noteCategories> {}
export interface CreateNoteCategory
  extends Optional<
    Omit<InferInsertModel<typeof noteCategories>, 'createdAt' | 'updatedAt'>,
    'id'
  > {}
export interface UpdateNoteCategory
  extends Omit<Partial<CreateNoteCategory>, 'id'> {}
