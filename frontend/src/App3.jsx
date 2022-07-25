import React, { useEffect, useRef, useState } from 'react';

import './styles/App3.css';

// ----------------------------------------------------------------------------

function create_Drag_OUTSIDE_OF_REACT_manager(canvas) {
  let isDragging = false;
  const state = {};

  const ctx = canvas.getContext('2d');

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawRect(x, y) {
    ctx.fillStyle = 'green';
    clearCanvas();
    ctx.fillRect(x, y, 20, 20);
  }

  const manager = {
    setVal(key, val) {
      state[key] = val;
    },

    getVal(key) {
      return state[key];
    },

    startDragging() {
      isDragging = true;
    },

    stopDragging() {
      isDragging = false;
    },

    get isDragging() {
      return isDragging;
    },

    onMouseMove(event) {
      if (isDragging) {
        const pos = getMousePos(event);
        // console.log(pos);
        // TODO: request animation frame
        drawRect(pos.x, pos.y);
      }
    },

    onMouseDown() {
      this.startDragging();
      console.log('manager onMouseDown');
    },

    onMouseUp() {
      console.log('manager onMouseUp');
      this.stopDragging();
      clearCanvas();
    },

    onClick() {
      console.log('manager onClick');
    },

    onMouseLeave() {
      console.log('manager onMouseLeave')
      this.stopDragging();
    },
  };

  const handlers = {
    'mousemove': (e) => manager.onMouseMove(e),
    'mousedown': (e) => manager.onMouseDown(e),
    'mouseup': (e) => manager.onMouseUp(e),
    'click': (e) => manager.onClick(e),
    // TODO: verify that mouseleave is robust and x-browser reliable?
    'mouseleave': (e) => manager.onMouseLeave(e),
  };

  for (let event in handlers) {
    canvas.addEventListener(event, handlers[event], false);
  }
  console.log('===================================')

  manager.cleanup = () => {
    for (let event in handlers) {
      canvas.removeEventListener(event, handlers[event], false);
    }
  };

  return manager;
}

function Drag_OUTSIDE_OF_REACT() {
  const canvasRef = useRef();
  const manager = useRef();

  useEffect(() => {
    console.log('canvasRef:', canvasRef.current);
    manager.current = create_Drag_OUTSIDE_OF_REACT_manager(canvasRef.current);
  }, []);

  return (
    <div className='Drag_OUTSIDE_OF_REACT'>
      <canvas height="400px" width="400px" ref={canvasRef}>
      </canvas>
    </div>
  );
}

function getMousePos(event) {
  var rect = event.target.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top),
  };
}

// ----------------------------------------------------------------------------

function App() {
  return (
    <div className='app3'>
      <Drag_OUTSIDE_OF_REACT />
    </div>
  );
}

// ----------------------------------------------------------------------------

export default App;
