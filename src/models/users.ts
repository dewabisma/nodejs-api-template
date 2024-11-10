import {
  text,
  timestamp,
  pgTable,
  bigint,
  pgEnum,
  varchar,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { notes } from './notes.js';
import { perfumes } from './perfumes.js';
import { enumToPgEnum } from '../utils/drizzleEnum.js';

export enum UserRole {
  Admin = 'admin',
  Customer = 'customer',
}
export const userRole = pgEnum('user_role', enumToPgEnum(UserRole));

export enum UserStatus {
  Inactive = 'inactive',
  Active = 'active',
}
export const userStatus = pgEnum('user_status', enumToPgEnum(UserStatus));

export enum OauthProvider {
  None = 'none',
  Google = 'google',
}
export const oauthProvider = pgEnum(
  'oauth_provider',
  enumToPgEnum(OauthProvider),
);

export enum TokenType {
  AccountVerification = 'account_verification',
  AccountPasswordReset = 'account_password_reset',
  OAuthToken = 'oauth_token',
}
export const tokenType = pgEnum('token_type', enumToPgEnum(TokenType));

export const users = pgTable(
  'users',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey(),
    username: varchar('username', { length: 255 }).unique(),
    email: varchar('email', { length: 255 }).unique(),
    dateOfBirth: varchar('date_of_birth', { length: 10 }),
    password: varchar('password', { length: 255 }),
    role: userRole('role').default(UserRole.Customer),
    oauthProvider: oauthProvider('oauth_provider'),
    oauthUid: text('oauth_uid'),
    status: userStatus('user_status').default(UserStatus.Inactive),
    lastLoginAt: timestamp('last_login_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    nameIdx: index('user_name_idx').on(table.username),
    mailIdx: index('user_mail_idx').on(table.email),
  }),
);

export const userFavoritedNotes = pgTable(
  'user_favorited_notes',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    noteId: bigint('note_id', { mode: 'bigint' })
      .notNull()
      .references(() => notes.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('ufn_user_idx').on(table.userId),
    noteIdx: index('ufn_note_idx').on(table.noteId),
    unique: unique('ufn_unique_favorited').on(table.userId, table.noteId),
  }),
);

export const userLikedPerfumes = pgTable(
  'user_liked_perfumes',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    perfumeId: bigint('perfume_id', { mode: 'bigint' })
      .notNull()
      .references(() => perfumes.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('ulp_user_idx').on(table.userId),
    perfumeIdx: index('ulp_perfume_idx').on(table.perfumeId),
    unique: unique('ulp_unique_liked').on(table.userId, table.perfumeId),
  }),
);

export const userTokens = pgTable(
  'user_tokens',
  {
    id: bigint('id', { mode: 'bigint' }).unique().primaryKey().notNull(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    type: tokenType('type').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('token_user_idx').on(table.userId),
    typeIdx: index('token_type_idx').on(table.type),
  }),
);
