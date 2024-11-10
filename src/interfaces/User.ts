import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from '../models/users.js';

export interface User extends InferSelectModel<typeof users> {}

export interface CreateUser
  extends Pick<
    InferInsertModel<typeof users>,
    'username' | 'email' | 'password'
  > {}

export interface CreateUserOAuth
  extends Pick<
    InferInsertModel<typeof users>,
    'username' | 'email' | 'oauthUid' | 'oauthProvider'
  > {}

export interface UpdateUser
  extends Pick<Partial<User>, 'username' | 'dateOfBirth'> {}

export interface CurrentUser
  extends Pick<User, 'username' | 'role' | 'status'> {
  id: bigint;
}

export interface UserLoginInput {
  username: string;
  password: string;
}

export interface UserVerification {
  token: string;
  userId: bigint;
}

export interface UserResetPassword {
  token: string;
  userId: bigint;
  password: string;
}
