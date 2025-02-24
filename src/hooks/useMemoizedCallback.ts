import { useCallback, useRef } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[]
): T {
  const ref = useRef<T>();
  ref.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return ref.current?.(...args);
  }, deps) as T;
}