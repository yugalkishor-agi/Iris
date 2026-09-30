export const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([promise, new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};
