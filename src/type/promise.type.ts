export type PromiseReturnType<T extends () => Promise<any>> = T extends () => Promise<infer R>
  ? R
  : never;
