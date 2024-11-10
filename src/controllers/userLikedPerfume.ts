import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import UserLikedPerfumeService from '../services/userLikedPerfume.js';
import type { CreateUserLikedPerfume } from '../interfaces/UserLikedPerfume.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const userLikedPerfumeServiceInstance = Container.get(
    UserLikedPerfumeService,
  );
  const { data, meta } =
    await userLikedPerfumeServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to create a review.',
    );

  const newLikedPerfume: CreateUserLikedPerfume = {
    ...(req.body as Omit<CreateUserLikedPerfume, 'userId'>),
    userId: BigInt(req.currentUser.id),
  };

  const userLikedPerfumeServiceInstance = Container.get(
    UserLikedPerfumeService,
  );
  const createdId =
    await userLikedPerfumeServiceInstance.create(newLikedPerfume);

  res.status(201).json({ data: createdId });
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to delete reviews.',
    );

  const { ids } = req.body;
  const userLikedPerfumeServiceInstance = Container.get(
    UserLikedPerfumeService,
  );
  const deletedIds = await userLikedPerfumeServiceInstance.deleteByIds(
    ids as bigint[],
    req.currentUser,
  );

  res.status(200).json({ data: deletedIds });
};
