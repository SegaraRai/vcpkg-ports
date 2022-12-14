import { useEventListener } from '@vueuse/core';
import type { ObjectDirective } from 'vue';

const STOP_FN_KEY = Symbol('focusByKey.stop');

function moveFocus(container: HTMLElement, offset: number): void {
  const tabbableElements = container.querySelectorAll('.tabbable');
  if (!tabbableElements) {
    return;
  }
  const tabbableElementsArray = Array.from(tabbableElements) as HTMLElement[];
  const currentFocusIndex = tabbableElementsArray.findIndex(
    (el): boolean => el === document.activeElement
  );
  if (currentFocusIndex < 0) {
    return;
  }
  const nextFocusIndex =
    (currentFocusIndex + offset + tabbableElementsArray.length) %
    tabbableElementsArray.length;
  const nextFocusElement = tabbableElementsArray[nextFocusIndex];
  setTimeout((): void => {
    nextFocusElement?.focus();
  }, 0);
}

function moveFocusByKey(container: HTMLElement, event: KeyboardEvent): void {
  if ((event.target as HTMLElement | null)?.tagName !== 'INPUT') {
    const ctrlOrMeta = event.ctrlKey !== event.metaKey;
    if (
      (!event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        /^([ -~]|Decimal|Multiply|Add|Divide|Subtract|Separator|ArrowLeft|ArrowRight|Backspace|Clear|Delete|EraseEof|Paste|Redo|Undo)$/i.test(
          event.key
        )) ||
      (ctrlOrMeta && /^[AV]$/i.test(event.key))
    ) {
      container.querySelector<HTMLElement>('input,textarea')?.focus();
      return;
    }
  }

  const offset =
    event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
  if (!offset) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  moveFocus(container, offset);
}

export const vFocusByKey: ObjectDirective<HTMLElement> = {
  mounted(element): void {
    (element as any)[STOP_FN_KEY] = useEventListener(
      element,
      'keydown',
      (event: KeyboardEvent): void => {
        event.stopPropagation();
        moveFocusByKey(element, event);
      }
    );
  },
  beforeUnmount(element): void {
    (element as any)[STOP_FN_KEY]?.();
  },
};
