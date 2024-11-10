import type { NextFunction, Request, Response } from 'express';
import { ObjectSchema, ValidationError } from 'yup';
import logger from '../loaders/logger.js';

/**
 * Validate route request data before processing. Can select what request to validate.
 * Also able to define schema for validation using yup.
 *
 * @param type - the request payload to verify.
 * @param validationSchema - the yup validation schema
 * @returns - response in error if not valid.
 */
const validateRequest =
  <T extends NonNullable<unknown>>(
    type: 'body' | 'query' | 'params',
    validationSchema: ObjectSchema<T>,
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info('Validating user inputs');

    try {
      await validationSchema.validate(req[type], {
        strict: true,
        abortEarly: false,
      });

      logger.info('Sucess validating user inputs');

      next();
    } catch (e) {
      logger.error(e);

      if (e instanceof ValidationError)
        res.status(400).json({
          errors: e.inner.map((err) => ({
            field: err.path,
            message: err.message,
          })),
        });
      else if (e instanceof Error)
        res.status(500).json({ errors: { message: e.message } });
      else
        res.status(500).json({ errors: { message: 'Unknown server error.' } });
    }
  };

export { validateRequest };
