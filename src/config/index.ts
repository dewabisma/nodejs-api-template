import dotenv from 'dotenv';
import type { CookieOptions } from 'express';

dotenv.config();

export default {
  port: process.env.PORT,
  corsWhitelist: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  apiBaseUrl: process.env.API_BASE_URL,
  webBaseUrl: process.env.WEB_BASE_URL,
  databaseURI: process.env.DATABASE_URI,
  databaseURL: process.env.DATABASE_BASE_URL,
  appName: 'Backend',
  authCookie: {
    name: 'authtoken',
    config: {
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    } satisfies CookieOptions,
  },
  nodeEnv: process.env.NODE_ENV,
  cookieSecret: process.env.COOKIE_SECRET,
  csrfSecret: process.env.CSRF_SECRET ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: `${process.env.API_BASE_URL}/api/auth/google/redirect`,
    failRedirectUrl: `${process.env.WEB_BASE_URL}/oauth/failed`,
    successRedirectUrl: `${process.env.WEB_BASE_URL}/oauth/success`,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    sender: process.env.EMAIL_SENDER,
    receiver: process.env.EMAIL_RECEIVER,
  },
  verifTokenExp: 3 * 24 * 60 * 60 * 1000,
  resetPassTokenExp: 3 * 24 * 60 * 60 * 1000,
};
