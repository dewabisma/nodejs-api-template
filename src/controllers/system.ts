import type { Request, Response } from 'express';
import axios from 'axios';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import { StatusCodes } from '../constants/statusCode.js';

import env from '../config/index.js';

export const rebuildWebsite = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  logger.debug('Calling rebuild website endpoint with payload: %o', req.file);

  if (env.nodeEnv === 'production') {
    const { data } = await axios.post(`${env.webhookUrl}`);

    res.status(StatusCodes.OK).json({ data });
  } else {
    const mockData = {
      result: {
        id: '8bd5c077-4dc6-4577-aa14-06a560ccdc1a',
      },
      success: true,
      errors: [],
      messages: [],
    };

    res.status(StatusCodes.OK).json({ data: mockData });
  }
};
