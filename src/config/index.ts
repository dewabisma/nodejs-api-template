import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT,
  corsWhitelist: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  apiBaseUrl: process.env.API_BASE_URL,
  webBaseUrl: process.env.WEB_BASE_URL,
  databaseURI: process.env.DATABASE_URI,
  databaseURL: process.env.DATABASE_BASE_URL,
  appName: 'Backend',
  authCookie: {
    name:"authtoken",
    config:{
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    }
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
  verifTokenExp: 3 * 24 * 60 * 60 * 1000,
  resetPassTokenExp: 3 * 24 * 60 * 60 * 1000,
};
