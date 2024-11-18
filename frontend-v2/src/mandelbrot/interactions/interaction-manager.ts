import { MousePos } from '@/mandelbrot/types';

import { getMousePos } from '@/mandelbrot/utils/get-mouse-pos';
import {
  FrozenRenderParams,
  RenderParams,
} from '@/mandelbrot/params/render-params';
import { RenderJob } from '@/mandelbrot/params/render-job';

import { performZoom } from './perform-zoom';
import { performPan } from './perform-pan';

class InteractionManager {
  private isDragging: boolean = false;
  private panMousePos: MousePos | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private getCurrentParams: () => FrozenRenderParams,
    private requestRender: (job: RenderJob) => void,
  ) {
    this.canvas = canvas;
    this.getCurrentParams = getCurrentParams;
    this.requestRender = requestRender;
    this.attachEventListeners();
  }

  private handleMouseDown = (event: MouseEvent) => {
    const rect: DOMRect = this.canvas.getBoundingClientRect();
    this.panMousePos = getMousePos(rect, event);
    this.isDragging = true;
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleMouseLeave = () => {
    this.isDragging = false;
  };

  private handleMouseMove = (event: MouseEvent) => {
    if (this.isDragging && this.panMousePos) {
      const pos = getMousePos(this.canvas.getBoundingClientRect(), event);
      const panVec = {
        x: this.panMousePos.x - pos.x,
        y: this.panMousePos.y - pos.y,
      };
      this.panMousePos = pos;

      const target = performPan(this.getCurrentParams(), panVec);
      this.requestRender(new RenderJob(target, this.canvas));
    }
  };

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomAmt = event.deltaY * -0.01;
    const mousePos = getMousePos(this.canvas.getBoundingClientRect(), event);

    const target = performZoom(this.getCurrentParams(), zoomAmt, mousePos);
    if (target) {
      this.requestRender(new RenderJob(target, this.canvas));
    }
  };

  attachEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('wheel', this.handleWheel);
  }

  detachEventListeners() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }
}

export { InteractionManager };
