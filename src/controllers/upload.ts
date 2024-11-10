import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import { StatusCodes } from '../constants/statusCode.js';
import imageUploader from '../middlewares/imageUploader.js';
import type { UploadOptions } from '../interfaces/Upload.js';

export const uploadImages = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const apiBaseUrl: string = Container.get('apiBaseUrl');
  const errorHandlers: CustomError.Handlers = Container.get('errors');

  logger.debug('Calling upload images endpoint with payload: %o', req.file);

  const { id, category, prefix } = req.query as any as UploadOptions;

  imageUploader(`/${category}/${id}${prefix ? `/${prefix}` : ''}`).single(
    'image',
  )(req, res, async (err) => {
    if (err) throw new errorHandlers.BadRequestError(err);

    if (!req.file)
      throw new errorHandlers.BadRequestError('Invalid upload request.');

    const filePath = req.file?.path.substring(6);

    res.status(StatusCodes.OK).json({ data: `${apiBaseUrl}${filePath}` });
  });
};

export const uploadSearchBackgroundImages = async (
  req: Request,
  res: Response,
) => {
  const logger: Logger = Container.get('logger');
  const apiBaseUrl: string = Container.get('apiBaseUrl');
  const errorHandlers: CustomError.Handlers = Container.get('errors');

  logger.debug('Calling upload images endpoint with payload: %o', req.file);

  if (!req.file)
    throw new errorHandlers.BadRequestError('Invalid upload request.');

  const filePath = req.file?.path.substring(6);

  res.status(StatusCodes.OK).json({ data: `${apiBaseUrl}${filePath}` });
};
