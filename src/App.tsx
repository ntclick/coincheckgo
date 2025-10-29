import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { CompleteDashboard } from './components/CompleteDashboard';
import { autoInitializeFHEVM } from './utils/fhevm';
import './components/ModernDashboard.css';
import './components/OriginalDesign.css';

function App() {
  useEffect(() => {
    // Auto-initialize FHEVM SDK when app loads (no wallet required)
    const initFHEVM = async () => {
      try {
        console.log('🚀 App starting - auto-initializing FHEVM SDK...');
        const success = await autoInitializeFHEVM();
        if (success) {
          console.log('✅ FHEVM SDK ready for use without wallet connection');
        } else {
          console.log('⚠️ FHEVM SDK auto-initialization failed, will retry when wallet connects');
        }
      } catch (error) {
        console.error('❌ FHEVM auto-initialization error:', error);
      }
    };

    initFHEVM();
  }, []);

  return (
    <div className="App">
      <Toaster position="top-right" />
      <CompleteDashboard />
    </div>
  );
}

export default App;
