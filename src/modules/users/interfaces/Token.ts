import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { userTokens } from '../models/users.js';

export interface Token extends InferSelectModel<typeof userTokens> {}

export interface CreateToken extends InferInsertModel<typeof userTokens> {}
