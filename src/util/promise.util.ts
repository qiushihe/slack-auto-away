export const promisedFn = async <TFnReturn, TFnArgs>(
  fn: (...args: TFnArgs[]) => Promise<TFnReturn>,
  ...args: Parameters<typeof fn>
): Promise<[Error, null] | [null, TFnReturn]> => {
  try {
    return [null, await fn(...args)];
  } catch (err) {
    return [err, null];
  }
};
