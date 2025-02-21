// TODO: use this in more places
function getContext2dSafe(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context not available');
  }
  // Was getting wierd type errors here... could look into it later.
  return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

export { getContext2dSafe };
