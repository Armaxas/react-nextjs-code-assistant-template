// Simple in-memory dedupe cache for fetch requests.
// Exported so multiple components can share the same inflight cache.
const __inflightFetches: Map<string, Promise<Response>> = new Map();

export const cachedFetch = (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  const key = typeof input === "string" ? input : JSON.stringify(input);

  if (__inflightFetches.has(key)) {
    return __inflightFetches.get(key)!.then((res) => res.clone());
  }

  const original = fetch(input, init).then((res) => res);
  __inflightFetches.set(key, original);
  original.finally(() => __inflightFetches.delete(key));
  return original.then((res) => res.clone());
};
