import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import UserFavoritedNoteService from '../services/userFavoritedNote.js';
import type { CreateUserFavoritedNote } from '../interfaces/UserFavoritedNote.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const userFavoritedNoteServiceInstance = Container.get(
    UserFavoritedNoteService,
  );
  const { data, meta } =
    await userFavoritedNoteServiceInstance.query(queryOptions);

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

  const newFavoritedNote: CreateUserFavoritedNote = {
    ...(req.body as Omit<CreateUserFavoritedNote, 'userId'>),
    userId: BigInt(req.currentUser.id),
  };

  const userFavoritedNoteServiceInstance = Container.get(
    UserFavoritedNoteService,
  );
  const createdId =
    await userFavoritedNoteServiceInstance.create(newFavoritedNote);

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
  const userFavoritedNoteServiceInstance = Container.get(
    UserFavoritedNoteService,
  );
  const deletedIds = await userFavoritedNoteServiceInstance.deleteByIds(
    ids as bigint[],
    req.currentUser,
  );

  res.status(200).json({ data: deletedIds });
};
