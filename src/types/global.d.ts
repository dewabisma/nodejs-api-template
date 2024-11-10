interface BigInt {
  toJSON: () => string;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Necessary<T, K extends keyof T> = Pick<Required<T>, K> & Omit<T, K>;

// To make typescript happy because the library doesn't have a d.ts file.
declare module 'express-async-errors' {}
