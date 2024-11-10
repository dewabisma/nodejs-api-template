/* eslint-disable @typescript-eslint/no-explicit-any */
import expressLoader from './express.js';
import postgreSqlLoader from './psql.js';
import domSanitizerLoader from './domSanitizer.js';
import webhookHandlersLoader from './webhook.js';
import dependencyInjectorLoader from './dependencyInjector.js';
import * as schemas from '../models/index.js';
import logger from './logger.js';

export default async ({ expressApp }) => {
  const psqlConnection = await postgreSqlLoader();
  logger.info('PostgreSQL Intialized');

  const purifier = domSanitizerLoader();
  logger.info('DOM Sanitizer Intialized');

  const webhookHandlers = webhookHandlersLoader();
  logger.info('DOM Sanitizer Intialized');

  const models = Object.entries(schemas).map((val) => ({
    // @dev we make is as any type because typescript infer the type wrong, each schema has name that can be used actually.
    name: val[0],
    model: val[1],
  }));
  dependencyInjectorLoader({
    psqlConnection,
    models,
    purifier,
    webhookHandlers,
  });
  logger.info('Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  logger.info('Express App Intialized');
};
