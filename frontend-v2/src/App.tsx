import { Explorer } from '@/features/explorer/Explorer';
import '@/styles/App.css';

function App() {
  console.log('=====================');
  console.log('=== App component ===');
  return (
    <div className='app'>
      <Explorer />
    </div>
  );
}

export { App };
