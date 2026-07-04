import React, { useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const NpmPanel = () => {
  const [npmQuery, setNpmQuery] = useState('');
  const [npmResults, setNpmResults] = useState([]);
  const [npmSearching, setNpmSearching] = useState(false);
  const [globalInstalling, setGlobalInstalling] = useState(null);
  const { showAlert } = useModal();

  const searchNpm = async (e) => {
    e.preventDefault();
    if (!npmQuery.trim()) return;
    setNpmSearching(true);
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(npmQuery)}&size=20`);
      const data = await res.json();
      setNpmResults(data.objects || []);
    } catch (err) {
      showAlert('Failed to search NPM registry.', { title: 'Search Error', icon: 'error' });
    }
    setNpmSearching(false);
  };

  const handleGlobalInstall = async (packageName) => {
    setGlobalInstalling(packageName);
    try {
      const res = await fetch('http://localhost:3000/api/npm/install-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      const data = await res.json();
      if (data.error) {
        showAlert(data.error, { title: 'Install Failed', icon: 'error' });
      } else {
        showAlert(data.message, { title: 'Install Complete', icon: 'success' });
      }
    } catch (e) {
      showAlert(`Network error while installing ${packageName}.`, { title: 'Error', icon: 'error' });
    }
    setGlobalInstalling(null);
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textTransform: 'uppercase', fontSize: '11px', color: '#858585', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Search size={14} /> NPM Registry Search
      </div>
      
      <form onSubmit={searchNpm} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder="Search for a package..."
          value={npmQuery}
          onChange={(e) => setNpmQuery(e.target.value)}
          style={{ flex: 1, padding: '8px 10px', background: '#1e1e1e', border: '1px solid #333', color: '#ccc', borderRadius: '4px', fontSize: '13px' }}
        />
        <button type="submit" disabled={npmSearching} style={{ background: '#0e639c', border: 'none', color: '#fff', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', opacity: npmSearching ? 0.7 : 1 }}>
          {npmSearching ? <Loader2 size={16} className="lucide-spin" /> : <Search size={16} />}
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {npmResults.length === 0 && !npmSearching && npmQuery && (
          <div style={{ color: '#858585', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>No packages found.</div>
        )}
        
        {npmResults.map(({ package: pkg }) => (
          <div key={pkg.name} style={{ padding: '12px 10px', borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e2c08d' }}>{pkg.name}</div>
              <div style={{ fontSize: '11px', color: '#858585', background: '#2d2d2d', padding: '2px 6px', borderRadius: '10px' }}>v{pkg.version}</div>
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4' }}>{pkg.description}</div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button 
                onClick={() => handleGlobalInstall(pkg.name)}
                disabled={globalInstalling === pkg.name}
                style={{ 
                  background: globalInstalling === pkg.name ? '#555' : '#0e639c', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  cursor: globalInstalling === pkg.name ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                {globalInstalling === pkg.name ? <Loader2 size={12} className="lucide-spin" /> : <Download size={12} />}
                {globalInstalling === pkg.name ? 'Installing...' : 'Install Global'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NpmPanel;
