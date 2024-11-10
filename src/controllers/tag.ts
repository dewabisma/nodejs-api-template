import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import TagService from '../services/tag.js';
import type { CreateTag, UpdateTag } from '../interfaces/Tag.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const tagServiceInstance = Container.get(TagService);
  const { data, meta } = await tagServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const tagServiceInstance = Container.get(TagService);
  const tag = await tagServiceInstance.getById(id);

  res.status(200).json({ data: tag });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const tagServiceInstance = Container.get(TagService);
  const createdId = await tagServiceInstance.create(req.body as CreateTag);

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const tagData = req.body as UpdateTag;

  const tagServiceInstance = Container.get(TagService);
  await tagServiceInstance.update(tagData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const tagServiceInstance = Container.get(TagService);
  const deletedIds = await tagServiceInstance.deleteByIds(ids as bigint[]);

  res.status(200).json({ data: deletedIds });
};
