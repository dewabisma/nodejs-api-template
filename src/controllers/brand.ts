import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import BrandService from '../services/brand.js';
import type { CreateBrand, UpdateBrand } from '../interfaces/Brand.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const brandServiceInstance = Container.get(BrandService);
  const { data, meta } = await brandServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const brandServiceInstance = Container.get(BrandService);
  const brand = await brandServiceInstance.getById(id);

  res.status(200).json({ data: brand });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const brandServiceInstance = Container.get(BrandService);
  const createdId = await brandServiceInstance.create(req.body as CreateBrand);

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const brandData = req.body as UpdateBrand;

  const brandServiceInstance = Container.get(BrandService);
  await brandServiceInstance.update(brandData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const brandServiceInstance = Container.get(BrandService);
  const deletedIds = await brandServiceInstance.deleteByIds(ids as bigint[]);

  res.status(200).json({ data: deletedIds });
};
