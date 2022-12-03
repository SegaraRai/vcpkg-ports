export interface FixedPositionSpec {
  readonly top?: number | null | undefined;
  readonly bottom?: number | null | undefined;
  readonly left?: number | null | undefined;
  readonly right?: number | null | undefined;
}

export function calcPosition(
  position: FixedPositionSpec,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): { readonly x: number; readonly y: number } {
  let x = 0;
  if (position.left != null) {
    x += position.left;
  }
  if (position.right != null) {
    x += canvasWidth - width - position.right;
  }
  if (position.left != null && position.right != null) {
    x /= 2;
  }

  let y = 0;
  if (position.top != null) {
    y += position.top;
  }
  if (position.bottom != null) {
    y += canvasHeight - height - position.bottom;
  }
  if (position.top != null && position.bottom != null) {
    y /= 2;
  }

  return { x, y };
}
