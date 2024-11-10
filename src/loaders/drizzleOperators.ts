import {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  exists,
  notExists,
  arrayOverlaps,
  arrayContained,
  arrayContains,
  between,
  notBetween,
  like,
  ilike,
  notIlike,
  not,
  and,
  or,
  desc,
  asc,
  SQL,
} from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * isNull and isNotNull doesn't take value, only take column.
 *
 * exists and notExists doesn't take column, only take query as value. unsupported for now.
 */
const operators = {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  // exists,
  // notExists,
  between,
  notBetween,
  like,
  ilike,
  notIlike,
  arrayOverlaps,
  arrayContained,
  arrayContains,
};

export type Operator = keyof typeof operators;

// 'not' used to negate/flip condition, only take single value.
const conjuctions = {
  and,
  or,
  not,
};

export type Conjuction = keyof typeof conjuctions;

const sorts = {
  desc,
  asc,
};

export type Sort = keyof typeof sorts;

export type OperatorClause = [string, string, any];
export type ConjuctionClause = [string, OperatorClause[]];
export type FilterClause = OperatorClause | ConjuctionClause;
export type OrderClause = [keyof typeof sorts, string][];

export interface QueryOptions {
  offset?: number;
  limit?: number | 'null';
  filter?: FilterClause;
  order?: OrderClause;
  page?: number;
}

export const buildFilters = (model: PgTable, conditions: FilterClause): SQL => {
  const prefix = conditions[0];

  const isConjuction = Object.keys(conjuctions).includes(prefix);
  if (isConjuction) {
    const conj = conditions[0] as string;
    const conjConditions = conditions[1] as OperatorClause[];
    const conjArgs = conjConditions.map((cond) => buildFilters(model, cond));

    return conjuctions[conj](...conjArgs);
  }

  const op = conditions[0] as string;
  const col = conditions[1] as string;

  if (!Object.prototype.hasOwnProperty.call(model, col))
    throw new Error(`Col ${col} is not exist in table model`);

  const isNonValueOp = ['isNotNull', 'isNull'].includes(prefix);
  if (isNonValueOp) {
    return operators[op](model[col]);
  }

  const isSpecialOp = ['between', 'notBetween'].includes(prefix);
  if (isSpecialOp) {
    const range = conditions[2] as any[];
    if (!Array.isArray(range) || range.length !== 2)
      throw new Error(
        'Between and Not Between operator take [any,any] as value.',
      );

    return operators[op](model[col], ...range);
  }

  const val = conditions[2] as any;

  return operators[op](model[col], val);
};

export const buildSorts = (model: PgTable, order: OrderClause) => {
  const orderArgs = order.map((val) => {
    const [dir, name] = val;

    if (!Object.prototype.hasOwnProperty.call(model, name))
      throw new Error(`Col ${name} is not exist in table model`);

    return sorts[dir](model[name]);
  });

  return orderArgs;
};

export const sqlBuilders = {
  buildFilters,
  buildSorts,
};
