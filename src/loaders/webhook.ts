import axios from 'axios';

import env from '../config/index.js';
import logger from './logger.js';

interface WebhookHandlerOptions {
  methodName: string;
  serviceName: string;
}

export default () => {
  /**
   * Make webhook post request  to trigger rebuild. If the system is in seeding mode then abort the request.
   */
  const handleBuildTrigger = async () => {
    // await axios.post(`${env.webhookUrl}`);
  };

  const webhookHandlers = {
    create: async (options: WebhookHandlerOptions) => {
      // logger.info(
      //   `Rebuild Triggered by Creating New Record on ${options.serviceName} calling ${options.methodName}`,
      // );
      // return handleBuildTrigger();
    },
    update: async (options: WebhookHandlerOptions) => {
      // logger.info(
      //   `Rebuild Triggered by Updating a Record on ${options.serviceName} calling ${options.methodName}`,
      // );
      // return handleBuildTrigger();
    },
    delete: async (options: WebhookHandlerOptions) => {
      // logger.info(
      //   `Rebuild Triggered by Deleteing one or more Records on ${options.serviceName} calling ${options.methodName}`,
      // );
      // return handleBuildTrigger();
    },
  };

  return webhookHandlers;
};
