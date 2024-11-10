import type { Request, Response } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import env from '../config/index.js';

const isProductionEnv = env.nodeEnv === 'production';

const {
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  ...(!isProductionEnv && { cookieName: 'wangi' }),
  getSecret: () => env.csrfSecret,
  cookieOptions: { secure: isProductionEnv },
});

const getCsrfToken = (req: Request, res: Response) => {
  const csrfToken = generateToken(req, res);
  // You could also pass the token into the context of a HTML response.
  res.json({ csrfToken });
};

export { getCsrfToken, doubleCsrfProtection };
