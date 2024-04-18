export const callPromiseSequentially = async <T>(list: (() => Promise<T>)[]): Promise<T | undefined> =>
  list.reduce<Promise<T | undefined>>(
    (prevPromise, nextFunc) => prevPromise.then(() => nextFunc()),
    Promise.resolve(undefined),
  );
