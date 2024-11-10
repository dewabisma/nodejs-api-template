import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { perfumes } from '../models/perfumes.js';

type PerfumeNote = { noteId: bigint; alias?: string };

export interface Perfume extends InferSelectModel<typeof perfumes> {}

export interface CreatePerfume
  extends Optional<
    Omit<
      InferInsertModel<typeof perfumes>,
      | 'createdAt'
      | 'updatedAt'
      | 'viewCount'
      | 'likeCount'
      | 'baseNotes'
      | 'middleNotes'
      | 'topNotes'
      | 'uncategorizedNotes'
    >,
    'id'
  > {
  baseNotes?: PerfumeNote[];
  middleNotes?: PerfumeNote[];
  topNotes?: PerfumeNote[];
  uncategorizedNotes?: PerfumeNote[];
}
export interface UpdatePerfume
  extends Omit<
    Partial<CreatePerfume>,
    | 'id'
    | 'baseNotes'
    | 'middleNotes'
    | 'topNotes'
    | 'uncategorizedNotes'
    | 'noteAliases'
  > {
  addedBaseNotes?: PerfumeNote[];
  addedMiddleNotes?: PerfumeNote[];
  addedTopNotes?: PerfumeNote[];
  addedUncategorizedNotes?: PerfumeNote[];

  removedBaseNotes?: bigint[];
  removedMiddleNotes?: bigint[];
  removedTopNotes?: bigint[];
  removedUncategorizedNotes?: bigint[];
}
