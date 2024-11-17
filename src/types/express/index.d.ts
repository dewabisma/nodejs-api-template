import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { CurrentUser } from '../../interfaces/User.ts';
import type * as query from '../../loaders/drizzleOperators.ts';
import type * as schemas from '../../models/index.ts';
import type { customErrors } from '../../loaders/customError.ts';

declare global {
  namespace Express {
    export interface Request {
      currentUser?: CurrentUser;
    }
  }

  namespace IG {
    export type UserMedia = InstagramMedia;
  }

  namespace Models {
    export type UserModel = typeof schemas.users;
    export type UserTokenModel = typeof schemas.userTokens;
    export type PromotionModel = typeof schemas.promotions;

    export type UserRole = typeof schemas.UserRole;
    export type AuthenticatedUser = CurrentUser;
    export type UserStatus = typeof schemas.UserStatus;
    export type TokenType = typeof schemas.TokenType;
  }

  namespace DB {
    export type SqlBuilders = typeof query.sqlBuilders;
    export type Driver = NodePgDatabase<typeof schemas>;
    export type QueryOptions = query.QueryOptions;
  }
  
  namespace CustomError {
    export type Handlers = typeof customErrors;
  }
}
