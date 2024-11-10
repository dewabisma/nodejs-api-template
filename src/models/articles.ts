import {
  text,
  timestamp,
  pgTable,
  bigint,
  pgEnum,
  varchar,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { brands } from './brands.js';
import { enumToPgEnum } from '../utils/drizzleEnum.js';
import { sql } from 'drizzle-orm';

export enum ArticleStatus {
  Draft = 'draft',
  Active = 'active',
}
export const articleStatus = pgEnum(
  'article_status',
  enumToPgEnum(ArticleStatus),
);

export enum ArticleType {
  Perfume = 'perfume',
  Event = 'event',
  Guide = 'guide',
}
export const articleType = pgEnum('article_type', enumToPgEnum(ArticleType));

export const articles = pgTable(
  'articles',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    brandId: bigint('brand_id', { mode: 'bigint' }).references(
      () => brands.id,
      { onDelete: 'set null' },
    ),
    metaKeywords: varchar('meta_keywords'),
    metaDescription: varchar('meta_description'),
    title: varchar('title', { length: 1000 }).unique().notNull(),
    slug: varchar('slug', { length: 1000 }).unique().notNull(),
    author: varchar('author', { length: 255 }).notNull(),
    imageBy: varchar('image_by', { length: 255 }).notNull(),
    cover: varchar('cover', { length: 255 }),
    banner: varchar('banner', { length: 255 }),
    content: text('content').notNull(),
    tags: bigint('tags', { mode: 'bigint' })
      .array()
      .default(sql`ARRAY[]::bigint[]`),
    isFeatured: boolean('is_featured').default(false),
    type: articleType('type').notNull(),
    status: articleStatus('status').default(ArticleStatus.Draft),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    brandIdx: index('article_brand_idx').on(table.brandId),
    tagsIdx: index('article_tags_idx').using('gin', table.tags),
  }),
);

export const tags = pgTable(
  'tags',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('tag_name_idx').on(table.name),
  }),
);
