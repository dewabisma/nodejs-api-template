import * as express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import passport from 'passport';

import env from '../config/index.js';

import { reqLimiter } from '../middlewares/rateLimit.js';
import { allowMethod } from '../middlewares/allowedMethod.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import { doubleCsrfProtection, getCsrfToken } from '../middlewares/csrf.js';
import { googleOAuthStrategy } from '../middlewares/oauth.js';
import { customErrors } from './customError.js';

import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/user.js';
import brandRoutes from '../routes/brand.js';
import noteRoutes from '../routes/note.js';
import perfumeRoutes from '../routes/perfume.js';
import articleRoutes from '../routes/article.js';
import promotionRoutes from '../routes/promotion.js';
import instagramRoutes from '../routes/instagram.js';
import searchRoutes from '../routes/search.js';
import contactUsRoutes from '../routes/contactUs.js';
import uploadRoutes from '../routes/upload.js';
import systemRoutes from '../routes/system.js';

import logger from './logger.js';

const corsOptions: CorsOptions = {
  origin: function (origin, cb) {
    logger.info(`CORS request by ${origin}`);

    if (!origin) return cb(null, true);
    if (env.corsWhitelist.includes(origin ?? '')) return cb(null, true);

    cb(new customErrors.BadRequestError('Not allowed by CORS'));
  },
  credentials: true,
};

export default async ({ app }: { app: express.Application }) => {
  // Health checks
  app.get('/status', (_, res) => {
    res.status(200).end();
  });
  app.head('/status', (_, res) => {
    res.status(200).end();
  });

  // Middlewares
  app.enable('trust proxy');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser(env.cookieSecret));
  passport.use(googleOAuthStrategy);
  // if (env.nodeEnv === 'production') app.use('/api', reqLimiter);
  if (env.nodeEnv === 'development') app.use(morgan('dev'));
  app.use(doubleCsrfProtection);

  // Routes
  app.use('/api/auth', allowMethod(['POST', 'GET']), authRoutes);
  app.use(
    '/api/users',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    userRoutes,
  );
  app.use(
    '/api/brands',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    brandRoutes,
  );
  app.use(
    '/api/notes',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    noteRoutes,
  );
  app.use(
    '/api/perfumes',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    perfumeRoutes,
  );
  app.use(
    '/api/articles',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    articleRoutes,
  );
  app.use(
    '/api/promotions',
    allowMethod(['POST', 'GET', 'DELETE', 'PUT']),
    promotionRoutes,
  );
  app.use('/api/contact-us', allowMethod(['POST']), contactUsRoutes);
  app.use('/api/instagram', allowMethod(['GET']), instagramRoutes);
  app.use('/api/search', allowMethod(['GET']), searchRoutes);
  app.use('/api/upload', allowMethod(['POST']), uploadRoutes);
  app.use('/api/system', allowMethod(['POST']), systemRoutes);
  app.get('/api/csrf-token', getCsrfToken);

  // Static Files
  app.use(express.static('public'));

  /// catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new customErrors.NotFoundError('Not Found');

    next(err);
  });

  app.use(errorHandler);

  return app;
};
