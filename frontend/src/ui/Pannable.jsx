import React, { useEffect, useRef, useState } from 'react';

import { getMousePos } from 'lib/getMousePos';
import { useThrottledFunc } from 'lib/useThrottledFunc';

const MIN_PAN_THRESHOLD = 4;

function Pannable({ onPan, throttleDelay, children }) {
  const [isPanning, setIsPanning] = useState(false);
  const [mousePos, setMousePos] = useState(null);
  const [prevPos, setPrevPos] = useState(null);
  const [vector, setVector] = useState(null);

  const _onMouseMove = event => {
    if (!isPanning) { return; }
    const newMousePos = getMousePos(event);
    setVector(calcPanVector(prevPos, newMousePos));

    setPrevPos(mousePos);
    setMousePos(newMousePos);
  };
  const throttledMouseMove = useThrottledFunc(_onMouseMove, throttleDelay);
  const onMouseMove = (throttleDelay ? throttledMouseMove : _onMouseMove);

  useEffect(() => {
    if (vector && magnitude(vector) >= MIN_PAN_THRESHOLD) {
      onPan && onPan(vector);
    }
  }, [mousePos]);

  return (
    <div
      className='pannable'
      onMouseDown={event => {
        const mousePos = getMousePos(event);
        setIsPanning(true);
        setMousePos(mousePos);
        setPrevPos(mousePos);
      }}
      onMouseUp={event => {
        const mousePos = getMousePos(event);
        setIsPanning(false);
        setMousePos(null);
        setPrevPos(null)
        setVector(null);
      }}
      onMouseMove={onMouseMove}
    >
      {children}
    </div>
  );
}

function calcPanVector(mousePos, prevPos) {
  return (prevPos ? 
    { x: mousePos.x - prevPos.x, y: mousePos.y - prevPos.y } :
    { ...mousePos }
  );
}

function magnitude(vec) {
  return Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
}

export { Pannable };
