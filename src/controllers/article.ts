import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import ArticleService from '../services/article.js';
import type { CreateArticle, UpdateArticle } from '../interfaces/Article.js';

export const query = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const queryOptions = req.query as DB.QueryOptions;

  const articleServiceInstance = Container.get(ArticleService);
  const { data, meta } = await articleServiceInstance.query(queryOptions);

  res.status(200).json({ data, meta });
};

export const queryRelatedArticles = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug(
    'Calling query related articles endpoint with payload: %o',
    req.query,
  );

  const id = req.params.id as any as bigint;
  const queryOptions = req.query as DB.QueryOptions;

  const articleServiceInstance = Container.get(ArticleService);
  const { data, meta } = await articleServiceInstance.querySimilaryArticles(
    id,
    queryOptions,
  );

  res.status(200).json({ data, meta });
};

export const getById = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling query endpoint with payload: %o', req.query);

  const id = req.params.id as any as bigint;
  const articleServiceInstance = Container.get(ArticleService);
  const article = await articleServiceInstance.getById(id);

  res.status(200).json({ data: article });
};

export const create = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling create endpoint with payload: %o', req.body);

  const articleServiceInstance = Container.get(ArticleService);
  const createdId = await articleServiceInstance.create(
    req.body as CreateArticle,
  );

  res.status(201).json({ data: createdId });
};

export const update = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling update endpoint with payload: %o', req.body);

  const id = req.params.id as any as bigint;
  const articleData = req.body as UpdateArticle;

  const articleServiceInstance = Container.get(ArticleService);
  await articleServiceInstance.update(articleData, id);

  res.status(204).end();
};

export const deleteMany = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling delete many endpoint with payload: %o', req.body);

  const { ids } = req.body;
  const articleServiceInstance = Container.get(ArticleService);
  const deletedIds = await articleServiceInstance.deleteByIds(ids as bigint[]);

  res.status(200).json({ data: deletedIds });
};
