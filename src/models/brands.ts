import {
  text,
  timestamp,
  pgTable,
  bigint,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

export const brands = pgTable(
  'brands',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    banner: varchar('banner', { length: 255 }),
    logo: varchar('logo', { length: 255 }),
    description: text('description'),
    website: varchar('website', { length: 255 }),
    igUsername: varchar('ig_username', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    name: index('brand_name_idx').on(table.name),
  }),
);
