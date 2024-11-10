import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { CurrentUser } from '../../interfaces/User.ts';
import type * as query from '../../loaders/drizzleOperators.ts';
import type * as schemas from '../../models/index.ts';
import type { customErrors } from '../../loaders/customError.ts';
import type { DOMPurifyI } from 'dompurify';
import type { InstagramMedia } from '../../interfaces/Instagram.ts';
import type webhook from '../../loaders/webhook.ts';

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
    export type UserLikedPerfumeModel = typeof schemas.userLikedPerfumes;
    export type UserFavoritedNoteModel = typeof schemas.userFavoritedNotes;
    export type UserTokenModel = typeof schemas.userTokens;
    export type PerfumeModel = typeof schemas.perfumes;
    export type PerfumeNoteAliasModel = typeof schemas.perfumeNoteAliases;
    export type NoteModel = typeof schemas.notes;
    export type BrandModel = typeof schemas.brands;
    export type NoteCategoryModel = typeof schemas.noteCategories;
    export type PerfumeReviewModel = typeof schemas.perfumeReviews;
    export type ArticleModel = typeof schemas.articles;
    export type TagModel = typeof schemas.tags;
    export type PromotionModel = typeof schemas.promotions;

    export type UserRole = typeof schemas.UserRole;
    export type AuthenticatedUser = CurrentUser;
    export type UserStatus = typeof schemas.UserStatus;
    export type TokenType = typeof schemas.TokenType;
    export type FragrancePyramid = typeof schemas.FragrancePyramid;
  }

  namespace DB {
    export type SqlBuilders = typeof query.sqlBuilders;
    export type Driver = NodePgDatabase<typeof schemas>;
    export type QueryOptions = query.QueryOptions;
  }

  namespace Webhook {
    export type Handlers = ReturnType<typeof webhook>;
  }

  namespace CustomError {
    export type Handlers = typeof customErrors;
  }

  namespace Sanitizer {
    export type DOMSanitizer = DOMPurifyI;
  }
}
