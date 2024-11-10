import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import env from '../config/index.js';

const { createLogger, format, transports } = winston;

const errorTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'application-errors-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,
  dirname: 'logs',
  level: 'error',
  maxSize: '10m',
  maxFiles: '7d',
});

errorTransport.on('error', (error) => {
  // TODO: Handle system error
});

errorTransport.on('rotate', (oldFilename, newFilename) => {
  // TODO: handle rotation
  // do something fun
});

const combinedTransport: DailyRotateFile = new DailyRotateFile({
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,
  dirname: 'logs',
  maxSize: '10m',
  maxFiles: '7d',
});

combinedTransport.on('error', (error) => {
  // TODO: Handle system error
});

combinedTransport.on('rotate', (oldFilename, newFilename) => {
  // TODO: handle rotation
  // do something fun
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: env.appName },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`.
    // - Write all logs error (and below) to `error.log`.
    //
    errorTransport,
    combinedTransport,
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (env.nodeEnv !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
