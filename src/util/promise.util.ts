import { PromiseReturnType } from "~src/type/promise.type";

export const promisedFn = async <TFnReturn = unknown, TFnArgs = never>(
  fn: (...args: TFnArgs[]) => Promise<TFnReturn>,
  ...args: Parameters<typeof fn>
): Promise<[Error, null] | [null, TFnReturn]> => {
  try {
    return [null, await fn(...args)];
  } catch (err) {
    return [err, null];
  }
};

type PromiseFn<TResult = any> = () => Promise<TResult>;

type PromisedResults<TFns extends PromiseFn[] | []> = {
  [TKey in keyof TFns]: PromiseReturnType<TFns[TKey]>;
};

type PaginatedPromisesOptions = {
  pageSize?: number;
};

export const paginatedPromises = async <TFns extends PromiseFn[] | []>(
  promiseFns: TFns,
  options?: PaginatedPromisesOptions
): Promise<[Error, null] | [null, PromisedResults<TFns>]> => {
  const pageSize = options?.pageSize ?? 10;

  const fns = promiseFns.slice(0, pageSize);
  const restFns = promiseFns.slice(pageSize);

  let results: any;
  try {
    results = await Promise.all(fns.map((fn) => fn()));
  } catch (err) {
    return [err as Error, null];
  }

  if (restFns.length > 0) {
    const [moreResultsErr, moreResults] = await paginatedPromises(restFns, options);
    if (moreResultsErr) {
      return [moreResultsErr, null];
    }
    return [null, [...results, ...moreResults] as any];
  } else {
    return [null, results as any];
  }
};
