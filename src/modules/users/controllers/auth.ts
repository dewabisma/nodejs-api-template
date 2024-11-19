import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import AuthService from '../services/auth.js';
import type { CreateUser, CreateUserOAuth } from '../interfaces/User.js';
import { StatusCodes } from '@/constants/statusCode.js';
import type { Profile } from 'passport-google-oauth20';
import { OauthProvider } from '../models/users.js';
import env from '@/config/index.js';

export const login = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling login endpoint with body: %o', req.body);

  const { username, password } = req.body;
  const authServiceInstance = Container.get(AuthService);
  const { user, token } = await authServiceInstance.login(username, password);

  res.cookie(env.authCookie.name, token, env.authCookie.config);
  res.status(StatusCodes.OK).json({ user });
};

export const logout = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');

  logger.debug('Calling login endpoint with body: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError("You aren't logged in yet.");

  const authServiceInstance = Container.get(AuthService);
  await authServiceInstance.logout(BigInt(req.currentUser.id));

  res.clearCookie(env.authCookie.name, env.authCookie.config);
  res.status(StatusCodes.NO_CONTENT).end();
};

export const checkAuthentication = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');

  logger.debug('Calling check authentication endpoint.');

  if (!req.currentUser) {
    res.clearCookie(env.authCookie.name, env.authCookie.config);

    throw new errorHandlers.UnauthenticatedError("You aren't logged in yet.");
  }

  res.status(StatusCodes.OK).json({
    data: req.currentUser,
  });
};

export const register = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling register endpoint with body: %o', req.body);

  const userInput = req.body as CreateUser;
  const authServiceInstance = Container.get(AuthService);

  const { user } = await authServiceInstance.register(userInput);

  res.status(StatusCodes.CREATED).json({ user });
};

export const handleOAuth = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling register by OAuth endpoint with query: %o', req.user);

  const googleProfile = req.user as any as Profile;
  const authServiceInstance = Container.get(AuthService);

  const existingUser = await authServiceInstance.loginByOAuth(
    OauthProvider.Google,
    googleProfile.id,
  );

  // Handle creating new account if not registered.
  if (!existingUser) {
    const userInput: CreateUserOAuth = {
      username: googleProfile.displayName.split(' ').join('_'),
      email: googleProfile.emails?.[0]?.value,
      oauthProvider: OauthProvider.Google,
      oauthUid: googleProfile.id,
    };

    const { token } = await authServiceInstance.registerByOAuth(userInput);

    res.redirect(`${env.google.successRedirectUrl}?token=${token}`);

    return;
  }

  res.redirect(`${env.google.successRedirectUrl}?token=${existingUser.token}`);
};

export const validateOAuthToken = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling valiedate oauth token endpoint.');

  const oauthToken = req.query.token as string | undefined;

  if (!oauthToken)
    throw new errorHandlers.BadRequestError('You need to pass oauth token.');

  const authServiceInstance = Container.get(AuthService);
  const { user, token } =
    await authServiceInstance.validateOauthToken(oauthToken);

  res.cookie(env.authCookie.name, token, env.authCookie.config);
  res.status(StatusCodes.OK).json({ user });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling register endpoint with query: %o', req.query);

  const email = req.query.email as string;
  const authServiceInstance = Container.get(AuthService);
  const { user } = await authServiceInstance.sendResetPasswordLink(email);

  res.status(StatusCodes.OK).json({
    user,
  });
};

export const resendVerificationToken = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling register endpoint with query: %o', req.query);

  const email = req.query.email as string;
  const authServiceInstance = Container.get(AuthService);
  const { user } = await authServiceInstance.sendVerifyAccountLink(email);

  res.status(StatusCodes.OK).json({
    user,
  });
};
