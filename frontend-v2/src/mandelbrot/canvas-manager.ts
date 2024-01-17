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
  private _isWaitingToRender: boolean = false;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    // TODO: default param values should be managed elsewhere
    this.paramsManager = new ParamsManager(RenderParams.getDefaultParams());

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
    this.queueRender();
  }

  cleanup(): void {
    this.interactionManager.detachEventListeners();
  }

  queueRender() {
    if (this._isWaitingToRender) {
      return;
    }
    window.requestAnimationFrame(() => this._render());
    this._isWaitingToRender = true;
  }

  async _render() {
    const params = this.paramsManager.current;
    const tileSizePx = TILE_SIZE_IN_PX;

    perfStats.resetStats('pointsToBitmap');
    // perfStats.resetStats('computeTile');
    // perfStats.resetStats('ctx.drawImage');
    await renderMandelbrot(this.canvas, params, tileSizePx);
    // perfStats.logAllStats('\t');
    perfStats.logStats('pointsToBitmap', '\t');

    this.paramsManager.commitTarget();
    this._isWaitingToRender = false;
  }
}

export { CanvasManager };
