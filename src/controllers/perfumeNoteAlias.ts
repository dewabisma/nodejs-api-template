import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import PerfumeNoteAliasService from '../services/perfumeNoteAlias.js';
import type {
  CreatePerfumeNoteAlias,
  UpdatePerfumeNoteAlias,
} from '../interfaces/PerfumeNoteAlias.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const perfumeNoteAliasServiceInstance = Container.get(
    PerfumeNoteAliasService,
  );
  const { data, meta } =
    await perfumeNoteAliasServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const perfumeNoteAliasServiceInstance = Container.get(
    PerfumeNoteAliasService,
  );
  const perfumeNoteAlias = await perfumeNoteAliasServiceInstance.getById(id);

  res.status(200).json({ data: perfumeNoteAlias });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const perfumeNoteAliasServiceInstance = Container.get(
    PerfumeNoteAliasService,
  );
  const createdId = await perfumeNoteAliasServiceInstance.create(
    req.body as CreatePerfumeNoteAlias,
  );

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const perfumeNoteAliasData = req.body as UpdatePerfumeNoteAlias;

  const perfumeNoteAliasServiceInstance = Container.get(
    PerfumeNoteAliasService,
  );
  await perfumeNoteAliasServiceInstance.update(perfumeNoteAliasData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const perfumeNoteAliasServiceInstance = Container.get(
    PerfumeNoteAliasService,
  );
  const deletedIds = await perfumeNoteAliasServiceInstance.deleteByIds(
    ids as bigint[],
  );

  res.status(200).json({ data: deletedIds });
};
