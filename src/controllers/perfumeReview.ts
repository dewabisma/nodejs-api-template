import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import PerfumeReviewService from '../services/perfumeReview.js';
import type {
  CreatePerfumeReview,
  UpdatePerfumeReview,
} from '../interfaces/PerfumeReview.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const perfumeReviewServiceInstance = Container.get(PerfumeReviewService);
  const { data, meta } = await perfumeReviewServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const perfumeReviewServiceInstance = Container.get(PerfumeReviewService);
  const perfumeReview = await perfumeReviewServiceInstance.getById(id);

  res.status(200).json({ data: perfumeReview });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to create a review.',
    );

  const newReview: CreatePerfumeReview = {
    ...(req.body as Omit<CreatePerfumeReview, 'userId'>),
    userId: BigInt(req.currentUser.id),
  };

  const perfumeReviewServiceInstance = Container.get(PerfumeReviewService);
  const createdId = await perfumeReviewServiceInstance.create(newReview);

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  if (!req.currentUser)
    throw new errorHandlers.UnauthenticatedError(
      'You need to login to update a review.',
    );

  const perfumeId = req.params.id as any as bigint;
  const perfumeReviewData = req.body as UpdatePerfumeReview;

  const perfumeReviewServiceInstance = Container.get(PerfumeReviewService);
  await perfumeReviewServiceInstance.update(
    perfumeReviewData,
    perfumeId,
    req.currentUser.id,
  );

  res.status(204).end();
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
  const perfumeReviewServiceInstance = Container.get(PerfumeReviewService);
  const deletedIds = await perfumeReviewServiceInstance.deleteByIds(
    ids as bigint[],
    req.currentUser,
  );

  res.status(200).json({ data: deletedIds });
};
