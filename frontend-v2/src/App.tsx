import { MandelbrotViewer } from '@/MandelbrotViewer';
import '@/styles/App.css';

function App() {
  console.log('=====================');
  console.log('=== App component ===');
  return (
    <div className='app'>
      <div className='app-header'>Mandelbrot with TypeScript</div>
      <MandelbrotViewer />
      {/* <PerfectZoomManually /> */}
    </div>
  );
}

export { App };
