import type { Request, Response, NextFunction } from 'express';
import pg from 'pg';

import { StatusCodes } from '../constants/statusCode.js';
import { CustomAPIError } from '../loaders/customError.js';

import logger from '../loaders/logger.js';

const { DatabaseError } = pg;

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const customError: CustomAPIError = {
    message: 'Something went wrong, please try again',
    statusCode: err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR,
    stack: '',
    name: 'Unknown Error',
    cause: '',
  };

  if (err instanceof DatabaseError && err.code === '23505') {
    const column = err.detail?.split(')=')[0]?.slice(5);

    customError.message = `${column} is already used.`;
    customError.statusCode = StatusCodes.CONFLICT;
    customError.stack = err.stack;
    customError.cause = err.cause;
    customError.name = err.name;

    logger.error(customError);

    res.status(customError.statusCode).json({
      errors: [{ field: column, message: customError.message }],
    });

    return;
  }

  if (err instanceof Error) {
    customError.message = err.message;
    customError.stack = err.stack;
    customError.cause = err.cause;
    customError.name = err.name;
  }

  if (err instanceof CustomAPIError) {
    customError.message = err.message;
    customError.statusCode = err.statusCode;
    customError.stack = err.stack;
    customError.cause = err.cause;
    customError.name = err.name;
  }

  logger.error(customError);

  res.status(customError.statusCode).json({ error: customError.message });
};

export { errorHandler };
