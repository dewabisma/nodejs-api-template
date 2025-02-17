import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import env from '@/config/index.js';
import logger from '../loaders/logger.js';
import { StatusCodes } from '../constants/statusCode.js';
import { Container } from 'typedi';
import UserService from '@/modules/users/services/user.js';
import type { CurrentUser } from '@/modules/users/interfaces/User.js';
import type { UserRole } from '@/modules/models.js';
const { JsonWebTokenError } = jwt;

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.cookies[env.authCookie.name]) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: 'You need to login to access this.' });
    return;
  }

  try {
    const userServiceInstance = Container.get(UserService);

    const token = req.cookies[env.authCookie.name];
    const data = jwt.verify(token, env.jwtSecret) as CurrentUser;

    // We need to cast the id as BigInt because originally it's serialized as string when creating a JWT..
    const deserializedData = { ...data, id: BigInt(data.id) };

    await userServiceInstance.getById(deserializedData.id);
    req.currentUser = deserializedData;

    next();
  } catch (e) {
    logger.error(e);

    if (e instanceof JsonWebTokenError) {
      res.clearCookie(env.authCookie.name);

      res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Token is already expired, please re-login.',
      });
    } else if (e instanceof Error)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ errors: e.message });
    else
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Unknown server error.' });
  }
};

const isAuthorizedAs =
  (roles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.currentUser ||
      !req.currentUser.role ||
      !roles.includes(req.currentUser.role)
    ) {
      res.status(StatusCodes.FORBIDDEN).json({
        error: `Only ${roles.join(', ')} ${roles.length > 1 ? 'are' : 'is'} authorized.`,
      });
      return;
    }

    next();
  };

export { isAuthenticated, isAuthorizedAs };
