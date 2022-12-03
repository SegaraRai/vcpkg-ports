export function asyncMap<T, U>(
  array: readonly T[],
  func: (e: T, i: number, a: readonly T[]) => Promise<U> | U,
  concurrency: number
): Promise<U[]> {
  return new Promise<U[]>((resolve, reject): void => {
    const resultMap = new Map<number, U>();
    let i = 0;
    let numRunning = 0;
    let rejected = false;
    const next = (): void => {
      if (rejected) {
        return;
      }
      if (i < array.length) {
        numRunning++;
        const index = i++;
        Promise.resolve(func(array[index], index, array)).then(
          (result): void => {
            resultMap.set(index, result);
            numRunning--;
            next();
          },
          (err): void => {
            if (!rejected) {
              rejected = true;
              reject(err);
            }
          }
        );
      } else if (numRunning === 0) {
        resolve(
          Array.from(resultMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([, result]) => result)
        );
      }
    };

    next();
    for (let j = 1; j < concurrency; j++) {
      next();
    }
  });
}

export async function asyncForeach<T>(
  array: readonly T[],
  func: (e: T, i: number, a: readonly T[]) => Promise<void> | void,
  concurrency: number
): Promise<void> {
  await asyncMap(array, func, concurrency);
}
