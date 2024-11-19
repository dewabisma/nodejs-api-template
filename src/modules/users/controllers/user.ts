import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import UserService from '../services/user.js';
import type {
  UpdateUser,
  UserResetPassword,
  UserVerification,
} from '../interfaces/User.js';
import AuthService from '../services/auth.js';

import { StatusCodes } from '@/constants/statusCode.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const userServiceInstance = Container.get(UserService);
  const { data, meta } = await userServiceInstance.query(queryOptions);

  res.status(StatusCodes.OK).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const userServiceInstance = Container.get(UserService);
  const user = await userServiceInstance.getById(id);

  res.status(StatusCodes.OK).json({ data: user });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const userData = req.body as UpdateUser;

  const userServiceInstance = Container.get(UserService);
  await userServiceInstance.update(userData, id);

  res.status(StatusCodes.NO_CONTENT).end();
};

export const updateSelf = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to create a review.',
    );

  const userData = req.body as UpdateUser;

  const userServiceInstance = Container.get(UserService);
  await userServiceInstance.update(userData, req.currentUser.id);

  res.status(StatusCodes.NO_CONTENT).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');

  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const userServiceInstance = Container.get(UserService);
  const deletedIds = await userServiceInstance.deleteByIds(ids as bigint[]);

  res.status(StatusCodes.OK).json({ data: deletedIds });
};

export const deleteSelf = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to create a review.',
    );

  const userServiceInstance = Container.get(UserService);
  await userServiceInstance.deleteByIds([req.currentUser.id]);

  res.clearCookie('wangiwangi', {
    sameSite: 'lax',
    httpOnly: true,
  });
  res.status(StatusCodes.NO_CONTENT).end();
};

export const verification = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling verification endpoint with query: %o', req.query);

  const { userId, token } = req.query as any as UserVerification;
  const authServiceInstance = Container.get(AuthService);
  const { user, token: accessToken } = await authServiceInstance.verifyAccount(
    userId,
    token,
  );

  res.cookie('wangiwangi', accessToken, {
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(StatusCodes.OK).json({
    date: user,
    message: `Success verifying user account with username: ${user.username}`,
  });
};

export const passwordResetting = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling reset password endpoint with body: %o', req.body);

  const { password, userId, token } = req.body as UserResetPassword;

  const authServiceInstance = Container.get(AuthService);
  await authServiceInstance.resetAccountPassword(userId, token, password);

  res.clearCookie('wangiwangi', {
    sameSite: 'lax',
    httpOnly: true,
  });
  res.status(StatusCodes.NO_CONTENT).end();
};
