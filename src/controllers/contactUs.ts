import type { Request, Response } from 'express';
import { Container } from 'typedi';
import type { Logger } from 'winston';
import { StatusCodes } from '../constants/statusCode.js';
import MailerService from '../services/mailer.js';
import type { ContactUsPayload } from '../interfaces/ContactUs.js';

export const forwardContactUsMessage = async (req: Request, res: Response) => {
  const logger: Logger = Container.get('logger');
  const errorHandlers: CustomError.Handlers = Container.get('errors');

  logger.debug(
    'Calling forward contact us message endpoint with payload: %o',
    req.body,
  );

  const { name, email, message } = req.body as ContactUsPayload;
  const mailServiceInstance = Container.get(MailerService);
  const { status, delivered } = await mailServiceInstance.SendContaUsEmail(
    name,
    email,
    message,
  );

  if (status === 'error' || delivered === 0)
    throw new errorHandlers.CustomAPIError(
      'Failed forwarding contact us message.',
    );

  res.status(StatusCodes.NO_CONTENT).end();
};
