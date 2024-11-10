import type { Request, Response } from 'express';
import { Container } from 'typedi';
import { StatusCodes } from '../constants/statusCode.js';
import InstagramService from '../services/instagram.js';

export const getFeeds = async (_: Request, res: Response) => {
  const instagramServiceInstace = Container.get(InstagramService);
  const userFeed = await instagramServiceInstace.fetchUserFeed();

  res.status(StatusCodes.OK).json({ data: userFeed });
};
