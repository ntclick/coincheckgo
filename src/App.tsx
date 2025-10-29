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
      <div style={{position:'fixed',top:0,left:0,right:0,padding:'6px 10px',background:'rgba(0,0,0,0.5)',color:'#00d4ff',fontSize:12,zIndex:9999}}>App loaded • If you only see this bar, report and I will investigate rendering.</div>
      <Toaster position="top-right" />
      <CompleteDashboard />
    </div>
  );
}

export default App;
