import crypto from 'crypto';
import { Logger } from 'winston';
import { and, eq, getTableColumns, or } from 'drizzle-orm';
import { Service, Inject } from 'typedi';

@Service()
export default class TokenService {
  constructor(
    @Inject('users') private userModel: Models.UserModel,
    @Inject('userTokens') private userTokenModel: Models.UserTokenModel,
    @Inject('psql')
    private psql: DB.Driver,
    @Inject('idGenerator') private generateUniqueID: () => bigint,
    @Inject('tokenType') private tokenType: Models.TokenType,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
  ) {}

  public async getVerificationToken(payload: {
    token?: string;
    userId?: bigint;
  }) {
    const { password, ...userCols } = getTableColumns(this.userModel);

    const [tokenRecord] = await this.psql
      .select({
        userToken: {
          token: this.userTokenModel.token,
          type: this.userTokenModel.type,
          createdAt: this.userTokenModel.createdAt,
        },
        user: userCols,
      })
      .from(this.userTokenModel)
      .innerJoin(
        this.userModel,
        eq(this.userTokenModel.userId, this.userModel.id),
      )
      .where(
        or(
          eq(this.userTokenModel.userId, payload.userId ?? 0n),
          eq(this.userTokenModel.token, payload.token ?? ''),
        ),
      );

    return tokenRecord;
  }

  public async createNewVerificationToken(userId: bigint) {
    const token = crypto.randomBytes(64).toString('hex').substring(0, 64);
    await this.psql.insert(this.userTokenModel).values({
      id: this.generateUniqueID(),
      token,
      type: this.tokenType.AccountVerification,
      userId,
    });

    return token;
  }

  public async deleteVerificationToken(userId: bigint) {
    await this.psql
      .delete(this.userTokenModel)
      .where(
        and(
          eq(this.userTokenModel.userId, userId),
          eq(this.userTokenModel.type, this.tokenType.AccountVerification),
        ),
      );
  }

  public async getResetPasswordToken(payload: {
    token?: string;
    userId?: bigint;
  }) {
    const { password, ...userCols } = getTableColumns(this.userModel);

    const [tokenRecord] = await this.psql
      .select({
        userToken: {
          token: this.userTokenModel.token,
          type: this.userTokenModel.type,
          createdAt: this.userTokenModel.createdAt,
        },
        user: userCols,
      })
      .from(this.userTokenModel)
      .innerJoin(
        this.userModel,
        eq(this.userTokenModel.userId, this.userModel.id),
      )
      .where(
        or(
          eq(this.userTokenModel.userId, payload.userId ?? 0n),
          eq(this.userTokenModel.token, payload.token ?? ''),
        ),
      );

    return tokenRecord;
  }

  public async createNewResetPasswordToken(userId: bigint) {
    const token = crypto.randomBytes(64).toString('hex').substring(0, 64);
    await this.psql.insert(this.userTokenModel).values({
      id: this.generateUniqueID(),
      token,
      type: this.tokenType.AccountPasswordReset,
      userId,
    });

    return token;
  }

  public async deletePasswordResetToken(userId: bigint) {
    await this.psql
      .delete(this.userTokenModel)
      .where(
        and(
          eq(this.userTokenModel.userId, userId),
          eq(this.userTokenModel.type, this.tokenType.AccountPasswordReset),
        ),
      );
  }

  public async getOAuthToken(token: string) {
    const { password, ...userCols } = getTableColumns(this.userModel);

    const [tokenRecord] = await this.psql
      .select({
        userToken: {
          token: this.userTokenModel.token,
          type: this.userTokenModel.type,
          createdAt: this.userTokenModel.createdAt,
        },
        user: userCols,
      })
      .from(this.userTokenModel)
      .innerJoin(
        this.userModel,
        eq(this.userTokenModel.userId, this.userModel.id),
      )
      .where(eq(this.userTokenModel.token, token));

    return tokenRecord;
  }

  public async createNewOAuthToken(userId: bigint) {
    const token = crypto.randomBytes(64).toString('hex').substring(0, 64);
    await this.psql.insert(this.userTokenModel).values({
      id: this.generateUniqueID(),
      token,
      type: this.tokenType.OAuthToken,
      userId,
    });

    return token;
  }

  public async deleteOAuthToken(userId: bigint) {
    await this.psql
      .delete(this.userTokenModel)
      .where(
        and(
          eq(this.userTokenModel.userId, userId),
          eq(this.userTokenModel.type, this.tokenType.OAuthToken),
        ),
      );
  }
}
