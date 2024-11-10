import 'reflect-metadata'; // We need this in order to use @Decorators
import 'express-async-errors'; // Patch for catching throw to error middleware
import './config/bigint.js'; // Patch for serializing big int
import './config/JSON.js'; // Patch for deserializing big int

import express from 'express';

import loaders from './loaders/index.js';
import logger from './loaders/logger.js';

async function startServer() {
  const app = express();

  await loaders({ expressApp: app });

  const server = app.listen(process.env.PORT, () => {
    logger.info(`Server is running at http://localhost:${process.env.PORT}`);
  });

  // TODO: consider to only email/notify devs, not shutting down the app
  process.on('unhandledRejection', async (err) => {
    logger.error(err);
  });

  // TODO: consider to only email/notify devs, not shutting down the app
  process.on('uncaughtException', async (err) => {
    logger.error(err);
  });

  process.on('SIGTERM', async () => {
    logger.info('Closing db connection');

    logger.info('Closing server');
    server.close(() => {
      logger.info('Server closed');
    });

    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Closing db connection');

    logger.info('Closing server');
    server.close(() => {
      logger.info('Server closed');
    });

    process.exit(0);
  });
}

startServer();
