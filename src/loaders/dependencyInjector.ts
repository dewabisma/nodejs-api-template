/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'typedi';
import nodemailer from 'nodemailer';
import env from '../config/index.js';
import { sqlBuilders } from './drizzleOperators.js';
import logger from './logger.js';
import { customErrors } from './customError.js';
import { generateUniqueID } from '../utils/generateId.js';
import { TokenType, UserRole, UserStatus } from '../models/users.js';
import slugify from '../utils/slugify.js';
import { FragrancePyramid } from '../models/perfumes.js';
import type { DOMPurifyI } from 'dompurify';
import { deleteUnusedAssets } from '../utils/cleanFiles.js';

export default ({
  psqlConnection,
  models,
  purifier,
  webhookHandlers,
}: {
  psqlConnection: DB.Driver;
  models: { name: string; model: any }[];
  purifier: DOMPurifyI;
  webhookHandlers: Webhook.Handlers;
}) => {
  try {
    models.forEach((m) => {
      Container.set(m.name, m.model);
    });
    Container.set('userRole', UserRole);
    Container.set('userStatus', UserStatus);
    Container.set('tokenType', TokenType);
    Container.set('fragrancePyramid', FragrancePyramid);

    Container.set('psql', psqlConnection);
    Container.set('sqlBuilders', sqlBuilders);

    Container.set('errors', customErrors);
    Container.set('logger', logger);
    Container.set('idGenerator', generateUniqueID);

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

    Container.set('apiBaseUrl', env.apiBaseUrl);
    Container.set('webBaseUrl', env.webBaseUrl);

    Container.set('igBaseUrl', env.instagram.baseUrl);
    Container.set('igGraphApiBaseUrl', env.instagram.graphApiBaseUrl);
    Container.set('igAccessToken', env.instagram.accessToken);
    Container.set('igUserId', env.instagram.userId);

    Container.set('resetPassTokenExp', env.resetPassTokenExp);
    Container.set('verifTokenExp', env.verifTokenExp);
    Container.set('jwtSecret', env.jwtSecret);

    Container.set('slugifier', slugify);
    Container.set('purifier', purifier);
    Container.set('webhookHandlers', webhookHandlers);
    Container.set('fileCleaner', deleteUnusedAssets);

    logger.info(
      'logger, psql, id_gen, and other dependencies are injected into container.',
    );
  } catch (e) {
    logger.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
