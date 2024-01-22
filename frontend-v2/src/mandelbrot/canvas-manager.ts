import { perfStats } from '@/lib/perf-stats';

import { renderMandelbrot } from '@/mandelbrot/render-mandelbrot';
import { TILE_SIZE_IN_PX } from '@/mandelbrot/zoom';

import { ParamsManager, RenderParams } from '@/mandelbrot/params-manager';
import { InteractionManager } from '@/mandelbrot/interactions/interaction-manager';

// TODO: this should be dynamically determined and updated on window resize
const CONTAINER_SIZE = { width: 1000, height: 700 };

class CanvasManager {
  canvas: HTMLCanvasElement;
  private interactionManager: InteractionManager;
  private paramsManager: ParamsManager;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.paramsManager = new ParamsManager();

    container.style.width = `${CONTAINER_SIZE.width}px`;
    container.style.height = `${CONTAINER_SIZE.height}px`;
    canvas.width = CONTAINER_SIZE.width;
    canvas.height = CONTAINER_SIZE.height;

    this.interactionManager = new InteractionManager(
      canvas,
      this.paramsManager,
      () => this.queueRender(),
    );
  }

  setup(): void {
    this.interactionManager.attachEventListeners();
    // this.queueRender();
    window.requestAnimationFrame(this.renderLoop);
  }

  cleanup(): void {
    this.interactionManager.detachEventListeners();
  }

  private renderLoop = async () => {
    // if (this.hasNewTilesToRender()) {
    if (this.paramsManager.hasNewParams) {
      this.render();
    }
    window.requestAnimationFrame(this.renderLoop);
  };

  private async render() {
    const params = this.paramsManager.current;
    const tileSizePx = TILE_SIZE_IN_PX;
    await renderMandelbrot(this.canvas, params, tileSizePx);
    this.paramsManager.commitTarget();
  }

  private async render_OLD() {
    const params = this.paramsManager.current;
    const tileSizePx = TILE_SIZE_IN_PX;

    perfStats.resetStats('pointsToBitmap');
    // perfStats.resetStats('computeTile');
    // perfStats.resetStats('ctx.drawImage');
    await renderMandelbrot(this.canvas, params, tileSizePx);
    // perfStats.logAllStats('\t');
    perfStats.logStats('pointsToBitmap', '\t');

    this.paramsManager.commitTarget();
  }
}

export { CanvasManager };
