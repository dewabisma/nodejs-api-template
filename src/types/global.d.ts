interface BigInt {
  toJSON: () => string;
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type Necessary<T, K extends keyof T> = Pick<Required<T>, K> & Omit<T, K>;
