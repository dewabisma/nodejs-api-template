import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';

import SearchService from '../services/search.js';

export const omniSearch = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling omni search endpoint with payload: %o', req.query);

  const keyword = req.query.keyword as string;

  const searchServiceInstance = Container.get(SearchService);
  const { data } = await searchServiceInstance.searchAll(keyword);

  res.status(200).json({ data });
};
