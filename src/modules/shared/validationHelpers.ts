import type { Sort } from '@/loaders/drizzleOperators.js';
import * as yup from 'yup';

// Utilities

// eslint-disable-next-line @typescript-eslint/ban-types
export const createEnumTest = <T extends Record<string, any>>(object: T) =>
  yup.mixed((input): input is T[keyof T] =>
    Object.values(object).includes(input),
  );

// Test Schema

const validOperatorTest = yup.tuple([
  yup.string().defined(),
  yup.string().defined(),
  yup.mixed().defined(),
]);

const validConjuctionTest = yup.tuple([
  yup.string().defined(),
  yup.array().of(validOperatorTest.defined()).defined(),
]);

export const validBigIntTest = yup
  .mixed(
    (input): input is bigint =>
      typeof input === 'string' || typeof input === 'bigint',
  )
  .transform((value: any, input, ctx) => {
    if (ctx.isType(value)) return value;

    return BigInt(value);
  });

export const validLinkTest = yup.string().max(255);
export const validDateTest = yup
  .string()
  .length(10)
  .matches(
    /^(?:(?:31(\/)(?:0[13578]|1[02]))\1|(?:(?:29|30)(\/)(?:0[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0[1-9]|1\d|2[0-8])(\/)(?:(?:0[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{4})$/,
  );

// Validation Schema

export const queryOptionsValidation = yup.object({
  offset: yup.number().optional().min(0),
  limit: yup.lazy((value) => {
    if (typeof value === 'number') return yup.number().optional().min(0);

    return yup.string().optional().equals(['null']);
  }),
  filter: yup.lazy((value) => {
    if (!value) return validOperatorTest.optional();

    const isConjuctionClause = ['and', 'or', 'not'].includes(value[0]);
    if (isConjuctionClause) return validConjuctionTest.optional();

    return validOperatorTest.optional();
  }),
  order: yup
    .array()
    .of(
      yup
        .tuple([
          yup
            .string()
            .oneOf(['asc', 'desc'] satisfies Sort[])
            .defined(),
          yup.string().defined(),
        ])
        .defined(),
    )
    .optional(),
  page: yup.number().optional().min(1),
});

export const paramsIdValidation = yup.object({
  id: validBigIntTest.required(),
});

export const bodyIdsValidation = yup.object({
  ids: yup.array().of(validBigIntTest.defined()).defined(),
});

export const randomizedQueryValidation = yup.object({
  amount: yup.number().optional().min(1),
});
