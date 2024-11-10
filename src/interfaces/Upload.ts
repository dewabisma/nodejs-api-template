export interface UploadOptions {
  id: bigint;
  category: UploadCategory;
  prefix?: string;
}

export interface UploadSearchBgOptions {
  order: '1' | '2';
}

export type UploadCategory =
  | 'brand'
  | 'perfume'
  | 'article'
  | 'note'
  | 'note-category'
  | 'promotion';
