/* eslint-disable @typescript-eslint/ban-types */
export const isInstanceOf = <InstanceOf extends Object>(
  type: unknown,
  property: keyof InstanceOf,
): type is InstanceOf => {
  return (type as InstanceOf)?.[property] !== undefined;
};
export const isValueEmpty = (object: Object) =>
  Object.values(object).every((x) => x === null || x === '' || x === undefined);
