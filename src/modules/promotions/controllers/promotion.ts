import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';

import type {
  CreatePromotion,
  UpdatePromotion,
} from '../interfaces/Promotion.js';
import PromotionService from '../services/promotion.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const promotionServiceInstance = Container.get(PromotionService);
  const { data, meta } = await promotionServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const promotionServiceInstance = Container.get(PromotionService);
  const promotion = await promotionServiceInstance.getById(id);

  res.status(200).json({ data: promotion });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const promotionServiceInstance = Container.get(PromotionService);
  const createdId = await promotionServiceInstance.create(
    req.body as CreatePromotion,
  );

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const promotionData = req.body as UpdatePromotion;

  const promotionServiceInstance = Container.get(PromotionService);
  await promotionServiceInstance.update(promotionData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const promotionServiceInstance = Container.get(PromotionService);
  const deletedIds = await promotionServiceInstance.deleteByIds(
    ids as bigint[],
  );

  res.status(200).json({ data: deletedIds });
};
