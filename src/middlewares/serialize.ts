import type { NextFunction, Request, Response } from 'express';

const serializeQueryOptions = async (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  const query: DB.QueryOptions = { ...req.query };

  if (query.filter) query.filter = JSON.parse(query.filter as any);
  if (query.order) query.order = JSON.parse(query.order as any);
  if (query.limit && query.limit !== 'null') query.limit = Number(query.limit);
  if (query.offset) query.offset = Number(query.offset);
  if (query.page) query.page = Number(query.page);

  req.query = query as any;

  next();
};

const serializeQuery =
  (options: { key: string; serializeFn: (value: any) => any }[]) =>
  async (req: Request, _: Response, next: NextFunction) => {
    const query = { ...req.query };

    options.forEach((option) => {
      if (query[option.key])
        query[option.key] = option.serializeFn(query[option.key]);
    });

    req.query = query as any;
    next();
  };

export { serializeQueryOptions, serializeQuery };
