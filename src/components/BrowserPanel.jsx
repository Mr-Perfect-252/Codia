import React, { useState } from 'react';
import { Globe, RefreshCw, ArrowRight, Home } from 'lucide-react';

const BrowserPanel = () => {
  const [urlInput, setUrlInput] = useState('http://localhost:5173');
  const [currentUrl, setCurrentUrl] = useState('http://localhost:5173');

  const handleGo = (e) => {
    e.preventDefault();
    let finalUrl = urlInput;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setCurrentUrl(finalUrl);
  };

  const handleRefresh = () => {
    const iframe = document.getElementById('native-browser-iframe');
    if (iframe) {
      iframe.src = currentUrl;
    }
  };

  const handleHome = () => {
    setUrlInput('http://localhost:5173');
    setCurrentUrl('http://localhost:5173');
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textTransform: 'uppercase', fontSize: '11px', color: '#858585', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Globe size={14} /> In-App Browser
      </div>
      
      <form onSubmit={handleGo} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <button type="button" onClick={handleHome} style={{ background: '#1e1e1e', border: '1px solid #333', color: '#ccc', padding: '0 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Home size={14} />
        </button>
        <button type="button" onClick={handleRefresh} style={{ background: '#1e1e1e', border: '1px solid #333', color: '#ccc', padding: '0 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} />
        </button>
        <input 
          type="text" 
          placeholder="Enter URL (e.g., http://localhost:5173)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', background: '#1e1e1e', border: '1px solid #333', color: '#ccc', borderRadius: '4px', fontSize: '13px', minWidth: 0 }}
        />
        <button type="submit" style={{ background: '#0e639c', border: 'none', color: '#fff', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={{ flex: 1, background: '#fff', borderRadius: '4px', overflow: 'hidden', border: '1px solid #333' }}>
        <iframe 
          id="native-browser-iframe"
          src={currentUrl} 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="In-App Browser"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default BrowserPanel;
