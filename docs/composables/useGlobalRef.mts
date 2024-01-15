import { type Ref, type UnwrapRef, ref } from 'vue';

export function useGlobalRef<T>(
  key: string | symbol,
  initialValue: T
): Ref<UnwrapRef<T>>;
export function useGlobalRef<T>(
  key: string | symbol
): Ref<UnwrapRef<T> | undefined>;

export function useGlobalRef<T>(
  key: string | symbol,
  initialValue?: T
): Ref<UnwrapRef<T> | undefined> {
  if (import.meta.env.SSR) {
    return ref(initialValue);
  }

  return ((window as any)[key] ||= ref(initialValue));
}
