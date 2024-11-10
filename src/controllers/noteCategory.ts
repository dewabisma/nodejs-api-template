import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import NoteCategoryService from '../services/noteCategory.js';
import type {
  CreateNoteCategory,
  UpdateNoteCategory,
} from '../interfaces/NoteCategory.js';
import { StatusCodes } from '../constants/statusCode.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  const { data, meta } = await noteCategoryServiceInstance.query(queryOptions);

  res.status(StatusCodes.OK).json({ data, meta });
};

export const getRandomRecords = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling getRandomRecords endpoint with query: %o', req.query);

  const { amount } = req.query as any as { amount?: number };

  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  const { data } = await noteCategoryServiceInstance.randomizedQuery(amount);

  res.status(StatusCodes.OK).json({ data });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  const noteCategory = await noteCategoryServiceInstance.getById(id);

  res.status(StatusCodes.OK).json({ data: noteCategory });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  const createdId = await noteCategoryServiceInstance.create(
    req.body as CreateNoteCategory,
  );

  res.status(StatusCodes.CREATED).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const noteCategoryData = req.body as UpdateNoteCategory;

  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  await noteCategoryServiceInstance.update(noteCategoryData, id);

  res.status(StatusCodes.NO_CONTENT).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const noteCategoryServiceInstance = Container.get(NoteCategoryService);
  const deletedIds = await noteCategoryServiceInstance.deleteByIds(
    ids as bigint[],
  );

  res.status(StatusCodes.OK).json({ data: deletedIds });
};
