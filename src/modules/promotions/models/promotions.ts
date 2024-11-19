import {
  text,
  timestamp,
  pgTable,
  bigint,
  varchar,
  index,
  boolean,
} from 'drizzle-orm/pg-core';

export const promotions = pgTable(
  'promotions',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    title: varchar('title', { length: 1000 }),
    label: varchar('label', { length: 1000 }),
    href: text('href'),
    cover: varchar('cover', { length: 255 }).notNull(),
    isActive: boolean('is_active').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    activeIdx: index('promotion_active_idx').on(table.isActive),
  }),
);
