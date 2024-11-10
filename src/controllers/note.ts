import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import PerfumeService from '../services/perfume.js';
import NoteService from '../services/note.js';
import type { CreateNote, UpdateNote } from '../interfaces/Note.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const noteServiceInstance = Container.get(NoteService);
  const { data, meta } = await noteServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const queryNotFavoritedByUser = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug(
    'Calling query not favorited by user endpoint with payload: %o',
    req.query,
  );

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to get not favorited note.',
    );

  const queryOptions = req.query as DB.QueryOptions;

  const noteServiceInstance = Container.get(NoteService);
  const { data, meta } = await noteServiceInstance.queryNotFavorited(
    req.currentUser.id,
    queryOptions,
  );

  res.status(200).json({ data, meta });
};

export const queryRelatedPerfumes = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug(
    'Calling query related perfumes endpoint with payload: %o',
    req.query,
  );

  const queryOptions = req.query as DB.QueryOptions;

  const id = req.params.id as any as bigint;
  const perfumeServiceInstance = Container.get(PerfumeService);
  const { data, meta } = await perfumeServiceInstance.queryPerfumesContainNote(
    id,
    queryOptions,
  );

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const noteServiceInstance = Container.get(NoteService);
  const note = await noteServiceInstance.getById(id);

  res.status(200).json({ data: note });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const noteServiceInstance = Container.get(NoteService);
  const createdId = await noteServiceInstance.create(req.body as CreateNote);

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const noteData = req.body as UpdateNote;

  const noteServiceInstance = Container.get(NoteService);
  await noteServiceInstance.update(noteData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const noteServiceInstance = Container.get(NoteService);
  const deletedIds = await noteServiceInstance.deleteByIds(ids as bigint[]);

  res.status(200).json({ data: deletedIds });
};
