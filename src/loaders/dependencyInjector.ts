/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'typedi';
import env from '../config/index.js';
import nodemailer from 'nodemailer';
import { sqlBuilders } from './drizzleOperators.js';
import logger from './logger.js';
import { customErrors } from './customError.js';
import { generateUniqueID } from '../utils/generateId.js';
import { TokenType, UserRole, UserStatus } from '../models/users.js';
import slugify from '../utils/slugify.js';
import { deleteUnusedAssets } from '../utils/cleanFiles.js';

export default ({
  psqlConnection,
  models,
}: {
  psqlConnection: DB.Driver;
  models: { name: string; model: any }[];
}) => {
  try {
    models.forEach((m) => {
      Container.set(m.name, m.model);
    });
    Container.set('userRole', UserRole);
    Container.set('userStatus', UserStatus);
    Container.set('tokenType', TokenType);

    Container.set('psql', psqlConnection);
    Container.set('sqlBuilders', sqlBuilders);

    Container.set('emailSender', env.email.sender);
    Container.set('emailReceiver', env.email.receiver);
    Container.set(
      'emailClient',
      nodemailer.createTransport({
        host: env.email.host,
        port: env.email.port,
        auth: env.email.auth,
      }),
    );

    Container.set('errors', customErrors);
    Container.set('logger', logger);
    Container.set('idGenerator', generateUniqueID);

    Container.set('apiBaseUrl', env.apiBaseUrl);
    Container.set('webBaseUrl', env.webBaseUrl);

    Container.set('resetPassTokenExp', env.resetPassTokenExp);
    Container.set('verifTokenExp', env.verifTokenExp);
    Container.set('jwtSecret', env.jwtSecret);

    Container.set('slugifier', slugify);
    Container.set('fileCleaner', deleteUnusedAssets);

    logger.info(
      'logger, psql, id_gen, and other dependencies are injected into container.',
    );
  } catch (e) {
    logger.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
