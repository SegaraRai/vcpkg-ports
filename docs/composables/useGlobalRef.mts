import { type Ref, type UnwrapRef, ref } from "vue";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return ((window as any)[key] ||= ref(initialValue));
}
