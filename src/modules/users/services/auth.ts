import bcrypt from 'bcrypt';
import { Logger } from 'winston';
import { and, eq, or } from 'drizzle-orm';
import { Service, Inject } from 'typedi';
import { add } from 'date-fns/add';
import jwt from 'jsonwebtoken';

import type { CreateUser, CurrentUser, User } from '../interfaces/User.js';
import type { OauthProvider } from '../models/users.js';
import type MailerService from './mailer.js';
import type TokenService from './token.js';

@Service()
export default class AuthService {
  constructor(
    @Inject('users') private userModel: Models.UserModel,
    @Inject('psql')
    private psql: DB.Driver,
    @Inject('idGenerator') private generateUniqueID: () => bigint,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
    @Inject('userRole') private userRole: Models.UserRole,
    @Inject('userStatus') private userStatus: Models.UserStatus,
    @Inject('verifTokenExp') private verifTokenExp: number,
    @Inject('resetPassTokenExp') private resetPassTokenExp: number,
    @Inject('jwtSecret') private jwtSecret: string,
    private mailer: MailerService,
    private tokenService: TokenService,
  ) {}

  public async sendVerifyAccountLink(email: string) {
    this.logger.info('Get user record from db');

    const [userRecord] = await this.psql
      .select({ id: this.userModel.id, email: this.userModel.email })
      .from(this.userModel)
      .where(eq(this.userModel.email, email));

    if (!userRecord)
      throw new this.CustomError.NotFoundError(
        `No user is registered with ${email} as its email.`,
      );

    const userWithToken = await this.tokenService.getVerificationToken({
      userId: userRecord.id,
    });
    let verifyToken = userWithToken?.userToken.token ?? '';

    if (userWithToken && userWithToken.userToken.createdAt) {
      this.logger.info(
        'User already has verify account token, checking if token is expired.',
      );
      const tokenDate = add(userWithToken.userToken.createdAt, {
        seconds: this.verifTokenExp / 1000,
      }).getTime();
      const currentDate = new Date().getTime();

      if (tokenDate < currentDate) {
        this.logger.info('Token is expired, deleting existing token.');
        await this.tokenService.deleteVerificationToken(userWithToken.user.id);

        this.logger.info('Generating new token.');
        verifyToken = await this.tokenService.createNewVerificationToken(
          userRecord!.id,
        );
      } else {
        this.logger.info('Token is not expired, reusing this token.');
      }
    }

    if (!verifyToken) {
      this.logger.info(
        "User don't have verification token, generating a new token.",
      );
      verifyToken = await this.tokenService.createNewVerificationToken(
        userRecord!.id,
      );
    }

    // TODO: if you need mail service then turn on this code.
    // const { delivered } = await this.mailer.SendAccountVerificationEmail(
    //   userRecord.email!,
    //   userRecord!.id,
    //   verifyToken,
    // );

    // if (delivered === 1)
    //   this.logger.info(
    //     `Success sending verification email to ${userRecord.email}`,
    //   );
    // else
    //   this.logger.error(
    //     `Failed sending verification email to ${userRecord.email}`,
    //   );

    return { user: userRecord, token: verifyToken };
  }

  public async register(userInput: CreateUser) {
    const salt = await bcrypt.genSalt(10);

    this.logger.info('Hashing password');
    const hashedPassword = await bcrypt.hash(userInput.password!, salt);

    this.logger.info('Creating user db record');
    const [userRecord] = await this.psql
      .insert(this.userModel)
      .values({
        ...userInput,
        password: hashedPassword,
        id: this.generateUniqueID(),
      })
      .returning({
        id: this.userModel.id,
        username: this.userModel.username,
        status: this.userModel.status,
        email: this.userModel.email,
      });

    this.logger.info('Sending user verification email.');
    const { token } = await this.sendVerifyAccountLink(userRecord?.email ?? '');

    return { user: userRecord, token };
  }

  public async registerByOAuth(userInput: CreateUser) {
    this.logger.info('Creating user db record');
    const [userRecord] = await this.psql
      .insert(this.userModel)
      .values({
        ...userInput,
        status: this.userStatus.Active,
        id: this.generateUniqueID(),
      })
      .returning({
        id: this.userModel.id,
        username: this.userModel.username,
        status: this.userModel.status,
        email: this.userModel.email,
        role: this.userModel.role,
      });

    this.logger.info('Generating OAuthToken');
    const token = await this.tokenService.createNewOAuthToken(userRecord!.id);

    return { user: userRecord, token };
  }

  public async login(username: string, password: string) {
    const [userRecord] = await this.psql
      .select()
      .from(this.userModel)
      .where(
        or(
          eq(this.userModel.email, username),
          eq(this.userModel.username, username),
        ),
      );
    if (!userRecord)
      throw new this.CustomError.BadRequestError('User is not registered.');
    if (userRecord.status === this.userStatus.Inactive)
      throw new this.CustomError.UnauthorizedError(
        'Your account is not active, please check your email for the activation link.',
      );

    this.logger.info('Checking password');
    const validPassword = await bcrypt.compare(password, userRecord.password!);

    if (validPassword) {
      this.logger.info('Password is valid!');
      this.logger.info('Generating JWT');
      const token = this.generateJwtToken(userRecord);
      await this.psql
        .update(this.userModel)
        .set({ lastLoginAt: new Date() })
        .where(eq(this.userModel.id, userRecord.id));

      Reflect.deleteProperty(userRecord, 'password');

      return { user: userRecord, token };
    } else {
      throw new this.CustomError.BadRequestError('Invalid login input.');
    }
  }

  public async loginByOAuth(provider: OauthProvider, uid: string) {
    const [userRecord] = await this.psql
      .select()
      .from(this.userModel)
      .where(
        and(
          eq(this.userModel.oauthProvider, provider),
          eq(this.userModel.oauthUid, uid),
        ),
      );

    if (!userRecord) {
      this.logger.info(
        'OAuth registered account is not exist. Returning undefined to tell to create a new one.',
      );

      return;
    }

    this.logger.info('Generating OAuthToken');
    const token = await this.tokenService.createNewOAuthToken(userRecord.id);

    return { user: userRecord, token };
  }

  public async validateOauthToken(oauthToken: string) {
    const userWithToken = await this.tokenService.getOAuthToken(oauthToken);

    if (!userWithToken)
      throw new this.CustomError.BadRequestError('Token is not valid.');

    this.logger.info('Generating JWT.');
    const token = this.generateJwtToken(userWithToken.user);
    await Promise.all([
      this.psql
        .update(this.userModel)
        .set({ lastLoginAt: new Date() })
        .where(eq(this.userModel.id, userWithToken.user.id)),
      this.tokenService.deleteOAuthToken(userWithToken.user.id),
    ]);

    return { user: userWithToken.user, token };
  }

  public async logout(userId: bigint) {
    await this.psql
      .update(this.userModel)
      .set({ lastLoginAt: new Date() })
      .where(eq(this.userModel.id, userId));
  }

  public async verifyAccount(userId: bigint, token: string) {
    this.logger.info('Verifying user.');

    this.logger.info('Getting user verification token in db.');
    const userWithToken = await this.tokenService.getVerificationToken({
      token,
    });

    if (
      !userWithToken ||
      !userWithToken.userToken ||
      !userWithToken.userToken.createdAt
    )
      throw new this.CustomError.NotFoundError(
        'No token has been issued for this user.',
      );

    this.logger.info('Checking if token is not expired.');
    const tokenDate = add(userWithToken.userToken.createdAt, {
      seconds: this.verifTokenExp / 1000,
    }).getTime();
    const currentDate = new Date().getTime();

    if (tokenDate < currentDate) {
      const [, token] = await Promise.all([
        this.tokenService.deleteVerificationToken(userId),
        this.tokenService.createNewVerificationToken(userId),
      ]);

      this.mailer.SendAccountVerificationEmail(
        userWithToken.user.email!,
        userWithToken.user.id,
        token,
      );

      throw new this.CustomError.BadRequestError(
        'Verification link has expired. Please check your email for new verification link.',
      );
    }

    this.logger.info('Checking if token is valid.');
    if (userWithToken.userToken.token !== token)
      throw new this.CustomError.BadRequestError('Invalid verification token.');

    this.logger.info('Updating user account status to active.');
    await Promise.all([
      this.psql
        .update(this.userModel)
        .set({ status: this.userStatus.Active })
        .where(eq(this.userModel.id, userId)),
      this.tokenService.deleteVerificationToken(userId),
    ]);

    this.logger.info('Success verifying user account.');

    this.logger.info('Generating JWT');
    const accessToken = this.generateJwtToken(userWithToken.user);
    await this.psql
      .update(this.userModel)
      .set({ lastLoginAt: new Date() })
      .where(eq(this.userModel.id, userWithToken.user.id));

    return { user: userWithToken.user, token: accessToken };
  }

  public async sendResetPasswordLink(email: string) {
    this.logger.info('Get user record from db');

    const [userRecord] = await this.psql
      .select({ id: this.userModel.id, email: this.userModel.email })
      .from(this.userModel)
      .where(eq(this.userModel.email, email));

    if (!userRecord)
      throw new this.CustomError.NotFoundError(
        `No user is registered with ${email} as its email.`,
      );

    const userWithToken = await this.tokenService.getResetPasswordToken({
      userId: userRecord.id,
    });
    let resetToken = userWithToken?.userToken.token ?? '';

    if (userWithToken && userWithToken.userToken.createdAt) {
      this.logger.info(
        'User already has reset password token, checking if token is expired.',
      );
      const tokenDate = add(userWithToken.userToken.createdAt, {
        seconds: this.verifTokenExp / 1000,
      }).getTime();
      const currentDate = new Date().getTime();

      if (tokenDate < currentDate) {
        this.logger.info('Token is expired, deleting existing token.');
        await this.tokenService.deletePasswordResetToken(userWithToken.user.id);

        this.logger.info('Generating new token.');
        resetToken = await this.tokenService.createNewResetPasswordToken(
          userRecord!.id,
        );
      } else {
        this.logger.info('Token is not expired, reusing this token.');
      }
    }

    if (!resetToken) {
      this.logger.info('Generating new token.');
      resetToken = await this.tokenService.createNewResetPasswordToken(
        userRecord!.id,
      );
    }

    this.logger.info('Sending user reset password email.');
    const { delivered } = await this.mailer.SendAccountPasswordResetEmail(
      userRecord.email!,
      userRecord.id,
      resetToken,
    );

    if (delivered === 1)
      this.logger.info(
        `Success sending verification email to ${userRecord.email}`,
      );
    else
      this.logger.error(
        `Failed sending verification email to ${userRecord.email}`,
      );

    return { user: userRecord, token: resetToken };
  }

  public async resetAccountPassword(
    userId: bigint,
    token: string,
    password: string,
  ) {
    this.logger.info('Resetting user password.');

    this.logger.info('Getting user reset password token in db.');
    const userWithToken = await this.tokenService.getResetPasswordToken({
      token,
    });

    if (
      !userWithToken ||
      !userWithToken.userToken ||
      !userWithToken.userToken.createdAt
    )
      throw new this.CustomError.NotFoundError(
        'No token has been issued for this user.',
      );

    this.logger.info('Checking if token is not expired.');
    const tokenDate = add(userWithToken.userToken.createdAt, {
      seconds: this.resetPassTokenExp,
    });
    const currentDate = new Date();

    if (tokenDate < currentDate) {
      const [, token] = await Promise.all([
        this.tokenService.deletePasswordResetToken(userId),
        this.tokenService.createNewResetPasswordToken(userId),
      ]);

      this.mailer.SendAccountPasswordResetEmail(
        userWithToken.user.email!,
        userWithToken.user.id,
        token,
      );

      throw new this.CustomError.BadRequestError(
        'Reset password link has expired. Please check your email for new reset password link.',
      );
    }

    this.logger.info('Checking if token is valid.');
    if (userWithToken.userToken.token !== token)
      throw new this.CustomError.BadRequestError(
        'Invalid password reset token.',
      );

    this.logger.info('Hashing new password');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    this.logger.info('Resetting user password to new password.');
    await Promise.all([
      this.psql
        .update(this.userModel)
        .set({ password: hashedPassword })
        .where(eq(this.userModel.id, userId)),
      this.tokenService.deletePasswordResetToken(userId),
    ]);
    this.logger.info('Success resetting user password to new password.');
  }

  private generateJwtToken(
    user: Pick<User, 'id' | 'role' | 'username' | 'status'>,
  ) {
    if (!this.jwtSecret)
      throw new this.CustomError.CustomAPIError(
        "Can't read jwt secret from env!",
      );

    this.logger.info(`Sign JWT for userId: ${user.id}`);

    const currentUser: CurrentUser = {
      id: user.id,
      role: user.role,
      username: user.username,
      status: user.status,
    };

    return jwt.sign(currentUser, this.jwtSecret, {
      expiresIn: '30d',
    });
  }
}
