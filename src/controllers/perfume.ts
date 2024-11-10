import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import PerfumeService from '../services/perfume.js';
import type { CreatePerfume, UpdatePerfume } from '../interfaces/Perfume.js';
import { StatusCodes } from '../constants/statusCode.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const perfumeServiceInstance = Container.get(PerfumeService);
  const { data, meta } = await perfumeServiceInstance.query(queryOptions);

  res.status(StatusCodes.OK).json({ data, meta });
};

export const discoverPerfumes = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling discover perfumes endpoint with query: %o', req.query);

  const { name, noteIds, ...options } = req.query as any as Omit<
    DB.QueryOptions,
    'filter'
  > & {
    name?: string;
    noteIds?: bigint[];
  };

  if (!name && !noteIds)
    throw new errorHandlers.BadRequestError(
      'Query should include either name or note ids.',
    );

  const perfumeServiceInstance = Container.get(PerfumeService);
  const { data, meta } = name
    ? await perfumeServiceInstance.querySimilaryPerfumes(name, options)
    : await perfumeServiceInstance.queryPerfumesByNotes(noteIds!, options);

  res.status(StatusCodes.OK).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const perfumeServiceInstance = Container.get(PerfumeService);
  const perfume = await perfumeServiceInstance.getById(id);

  res.status(StatusCodes.OK).json({ data: perfume });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const perfumeServiceInstance = Container.get(PerfumeService);
  const createdId = await perfumeServiceInstance.create(
    req.body as CreatePerfume,
  );

  res.status(StatusCodes.CREATED).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const perfumeData = req.body as UpdatePerfume;

  const perfumeServiceInstance = Container.get(PerfumeService);
  await perfumeServiceInstance.update(perfumeData, id);

  res.status(StatusCodes.NO_CONTENT).end();
};

export const incrementViewCount = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug(
    'Calling increment view count endpoint with payload: %o',
    req.body,
  );

  const id = req.params.id as any as bigint;

  const perfumeServiceInstance = Container.get(PerfumeService);
  await perfumeServiceInstance.incrementViewCount(id);

  res.status(StatusCodes.NO_CONTENT).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const perfumeServiceInstance = Container.get(PerfumeService);
  const deletedIds = await perfumeServiceInstance.deleteByIds(ids as bigint[]);

  res.status(StatusCodes.OK).json({ data: deletedIds });
};
