import type { NextFunction, Request, Response } from 'express';
import logger from '../loaders/logger.js';

type Method = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

const allowMethod =
  (methods: Method[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    logger.error(`REQUEST FOUND: ${req.hostname} host | ${req.ip} ip`);

    if (methods.includes(req.method as Method)) return next();

    res.set('Allow', methods.join(', ').toUpperCase());
    res.status(405).json({
      error: `The ${req.method} method for the ${req.originalUrl} route is not supported.`,
    });
  };

export { allowMethod };
