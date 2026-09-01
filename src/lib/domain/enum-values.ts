/** Convert a string enum to the tuple shape expected by z.enum. */
export const enumValues = <const T extends Record<string, string>>(value: T) =>
  Object.values(value) as unknown as [T[keyof T], ...(T[keyof T])[]];
