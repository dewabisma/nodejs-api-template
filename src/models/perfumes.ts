import {
  text,
  timestamp,
  pgTable,
  bigint,
  varchar,
  pgEnum,
  smallint,
  boolean,
  index,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import { brands } from './brands.js';
import { notes } from './notes.js';
import { users } from './users.js';
import { enumToPgEnum } from '../utils/drizzleEnum.js';

export enum Occasion {
  Day = 'day',
  Night = 'night',
  AllDay = 'all_day',
}
export const occasion = pgEnum('occasion', enumToPgEnum(Occasion));

export enum Gender {
  Male = 'male',
  Female = 'female',
  Unisex = 'unisex',
}
export const gender = pgEnum('gender', enumToPgEnum(Gender));

export enum FragrancePyramid {
  Top = 'top',
  Middle = 'middle',
  Base = 'base',
  None = 'none',
}
export const fragrancePyramid = pgEnum(
  'fragrance_pyramid',
  enumToPgEnum(FragrancePyramid),
);

export enum PerfumeType {
  XDP = 'extrait_de_parfum',
  EDP = 'eau_de_parfum',
  EDT = 'eau_de_toilette',
  EDC = 'eau_de_cologne',
  BM = 'body_mist',
  OP = 'oil_perfume',
  SP = 'solid_perfume',
}
export const perfumeType = pgEnum('perfume_type', enumToPgEnum(PerfumeType));

export const perfumes = pgTable(
  'perfumes',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    gender: gender('gender').notNull(),
    price: smallint('price').default(0),
    releaseDate: varchar('release_date', { length: 10 }),
    variants: jsonb('variants')
      .$type<{ label: string; thumbnail: string }[]>()
      .notNull(),
    brandId: bigint('brand_id', { mode: 'bigint' }).references(() => brands.id),
    type: perfumeType('perfume_type').notNull(),
    baseNotes: bigint('base_notes', { mode: 'bigint' }).array(),
    middleNotes: bigint('middle_notes', { mode: 'bigint' }).array(),
    topNotes: bigint('top_notes', { mode: 'bigint' }).array(),
    uncategorizedNotes: bigint('uncategorized_notes', {
      mode: 'bigint',
    }).array(),
    occasion: occasion('occasion').notNull(),
    isHalal: boolean('is_halal').default(false),
    isBpomCertified: boolean('is_bpom_certified').default(false),
    isFeatured: boolean('is_featured').default(false),
    viewCount: bigint('view_count', { mode: 'number' }).default(0),
    likeCount: bigint('like_count', { mode: 'number' }).default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('perfume_name_idx').on(table.name),
    genderIdx: index('perfume_gender_idx').on(table.gender),
    priceIdx: index('perfume_price_idx').on(table.price),
    brandIdx: index('perfume_brand_idx').on(table.brandId),
    typeIdx: index('perfume_type_idx').on(table.type),
    occasionIdx: index('perfume_occasion_idx').on(table.occasion),
    halalIdx: index('perfume_halal_idx').on(table.isHalal),
    bpomIdx: index('perfume_bpom_idx').on(table.isBpomCertified),
    baseNotesIdx: index('perfume_base_notes_idx').using('gin', table.baseNotes),
    middleNotesIdx: index('perfume_middle_notes_idx').using(
      'gin',
      table.middleNotes,
    ),
    topNotesIdx: index('perfume_top_notes_idx').using('gin', table.topNotes),
    uncategorizedNotesIdx: index('perfume_uncategorized_notes_idx').using(
      'gin',
      table.uncategorizedNotes,
    ),
  }),
);

export const perfumeNoteAliases = pgTable(
  'perfume_note_aliases',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    perfumeId: bigint('perfume_id', { mode: 'bigint' })
      .notNull()
      .references(() => perfumes.id, { onDelete: 'cascade' }),
    noteId: bigint('note_id', { mode: 'bigint' })
      .notNull()
      .references(() => notes.id, { onDelete: 'set null' }),
    noteAlias: varchar('note_alias', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    perfumeIdx: index('pna_perfume_idx').on(table.perfumeId),
    noteIdx: index('pna_note_idx').on(table.noteId),
    noteAliasIdx: index('pna_note_alias_idx').on(table.noteAlias),
  }),
);

export const perfumeReviews = pgTable(
  'perfume_reviews',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    perfumeId: bigint('perfume_id', { mode: 'bigint' })
      .notNull()
      .references(() => perfumes.id, { onDelete: 'cascade' }),
    comment: text('comment').notNull(),
    rating: smallint('rating').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('pr_user_idx').on(table.userId),
    perfumeIdx: index('pr_perfume_idx').on(table.perfumeId),
    ratingIdx: index('pr_rating_idx').on(table.rating),
    unique: unique('pr_unique_review').on(table.userId, table.perfumeId),
  }),
);
