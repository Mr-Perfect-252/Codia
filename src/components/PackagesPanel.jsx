import React, { useState, useEffect } from 'react';
import { Package, Terminal as TerminalIcon, GitBranch, RefreshCw, Download, Box, Container, Loader2 } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const PackagesPanel = () => {
  const [tools, setTools] = useState({ git: null, node: null, npm: null, bun: null, pnpm: null, yarn: null, python: null, pip: null, docker: null });
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(null);
  const { showAlert } = useModal();

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/check');
      const data = await res.json();
      setTools(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleInstall = async (name) => {
    const isNpmInstallable = ['bun', 'pnpm', 'yarn'].includes(name.toLowerCase());
    if (!isNpmInstallable) {
      showAlert(`To install ${name}, please use your host PC's terminal or download the official installer.`, { title: `Install ${name}`, icon: 'info' });
      return;
    }

    setInstalling(name);
    try {
      const res = await fetch('/api/system/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: name.toLowerCase() })
      });
      const data = await res.json();
      
      if (data.error) {
        showAlert(data.error, { title: `Installation Failed`, icon: 'error' });
      } else {
        showAlert(data.message, { title: 'Installation Complete', icon: 'success' });
        fetchTools(); // Refresh the list
      }
    } catch (e) {
      showAlert(`Network error while trying to install ${name}.`, { title: `Error`, icon: 'error' });
    }
    setInstalling(null);
  };

  const ToolRow = ({ name, icon, info }) => {
    const isCurrentlyInstalling = installing === name;
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333' }}>
        <div style={{ marginRight: '10px', color: '#858585' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', color: '#cccccc', fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: info?.installed ? '#4caf50' : '#f44336', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {info?.installed ? info.version : 'Not Installed'}
          </div>
        </div>
        {!info?.installed && (
          <button 
            disabled={isCurrentlyInstalling || installing !== null}
            style={{
            background: isCurrentlyInstalling ? '#555' : '#0e639c',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            cursor: (isCurrentlyInstalling || installing !== null) ? 'not-allowed' : 'pointer',
            borderRadius: '2px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            marginLeft: '8px',
            opacity: (installing !== null && installing !== name) ? 0.5 : 1
          }} onClick={() => handleInstall(name)}>
            {isCurrentlyInstalling ? <Loader2 size={12} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />} 
            {isCurrentlyInstalling ? 'Installing...' : 'Install'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ textTransform: 'uppercase', fontSize: '11px', color: '#858585', letterSpacing: '0.05em' }}>
          System Developer Tools
        </div>
        <button onClick={fetchTools} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', color: '#858585' }}>
            Checking system...
          </div>
        ) : (
          <>
            <ToolRow name="Git" icon={<GitBranch size={16} />} info={tools.git} />
            <ToolRow name="Node.js" icon={<TerminalIcon size={16} />} info={tools.node} />
            <ToolRow name="npm" icon={<Package size={16} />} info={tools.npm} />
            <ToolRow name="Yarn" icon={<Package size={16} />} info={tools.yarn} />
            <ToolRow name="Bun" icon={<Box size={16} />} info={tools.bun} />
            <ToolRow name="pnpm" icon={<Box size={16} />} info={tools.pnpm} />
            <ToolRow name="Python" icon={<TerminalIcon size={16} />} info={tools.python} />
            <ToolRow name="pip" icon={<Package size={16} />} info={tools.pip} />
            <ToolRow name="Docker" icon={<Container size={16} />} info={tools.docker} />
          </>
        )}
      </div>
    </div>
  );
};

export default PackagesPanel;
