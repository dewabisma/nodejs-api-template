import {
  text,
  timestamp,
  pgTable,
  bigint,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

export const notes = pgTable(
  'notes',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description').notNull(),
    categoryId: bigint('category_id', { mode: 'bigint' })
      .notNull()
      .references(() => noteCategories.id, { onDelete: 'restrict' }),
    icon: varchar('icon', { length: 255 }).notNull(),
    cover: varchar('cover', { length: 255 }).notNull(),
    popularityCount: bigint('like_count', { mode: 'number' }).default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('note_name_idx').on(table.name),
    categoryIdx: index('note_category_idx').on(table.categoryId),
  }),
);

export const noteCategories = pgTable(
  'note_categories',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description').notNull(),
    cover: varchar('cover', { length: 255 }).notNull(),
    color: varchar('color', { length: 8 }).notNull(),
    shade: varchar('shade', { length: 8 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('category_name_idx').on(table.name),
  }),
);
