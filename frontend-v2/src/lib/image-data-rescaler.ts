class ImageDataRescaler {
  private oldCanvas: OffscreenCanvas;
  private oldCtx: OffscreenCanvasRenderingContext2D;
  private rescaledCanvas: OffscreenCanvas;
  private rescaledCtx: OffscreenCanvasRenderingContext2D;

  constructor(
    initialSize: { width: number; height: number },
    maxRescale: number,
  ) {
    // Create the 'old' canvas for the initial size
    this.oldCanvas = new OffscreenCanvas(initialSize.width, initialSize.height);
    const oldCtx = this.oldCanvas.getContext('2d');
    if (!oldCtx) throw new Error('Could not get 2d context for old canvas');
    this.oldCtx = oldCtx;

    // Create the 'rescaled' canvas based on the max rescale factor
    const scaledWidth = initialSize.width * maxRescale;
    const scaledHeight = initialSize.height * maxRescale;
    this.rescaledCanvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const rescaledCtx = this.rescaledCanvas.getContext('2d');
    if (!rescaledCtx)
      throw new Error('Could not get 2d context for rescaled canvas');
    this.rescaledCtx = rescaledCtx;
  }

  rescale(imgData: ImageData, scale: number): ImageData {
    // Clear the old canvas and draw the input image data
    this.oldCtx.clearRect(0, 0, this.oldCanvas.width, this.oldCanvas.height);
    this.oldCtx.putImageData(imgData, 0, 0);

    // Determine the new size and clear the rescaled canvas
    const newSize = {
      width: imgData.width * scale,
      height: imgData.height * scale,
    };
    this.rescaledCtx.clearRect(
      0,
      0,
      this.rescaledCanvas.width,
      this.rescaledCanvas.height,
    );

    // Draw on the rescaled canvas with scaling
    this.rescaledCtx.drawImage(
      this.oldCanvas,
      0,
      0,
      imgData.width,
      imgData.height, // src rect
      0,
      0,
      newSize.width,
      newSize.height, // dst rect
    );

    return this.rescaledCtx.getImageData(0, 0, newSize.width, newSize.height);
  }
}

export { ImageDataRescaler };
