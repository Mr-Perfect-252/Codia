import React, { useState } from 'react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Terminal from './components/Terminal';
import ActivityBar from './components/ActivityBar';
import SearchPanel from './components/SearchPanel';
import GitPanel from './components/GitPanel';
import PackagesPanel from './components/PackagesPanel';
import NpmPanel from './components/NpmPanel';
import BrowserPanel from './components/BrowserPanel';
import HtmlPreviewPanel from './components/HtmlPreviewPanel';
import { Menu, Monitor } from 'lucide-react';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [activeTab, setActiveTab] = useState('explorer');
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('codia_auth') === 'true'
  );
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showFullTerminal, setShowFullTerminal] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (authCode === 'I-AM-SOHAN-252') {
      setIsAuthenticated(true);
      sessionStorage.setItem('codia_auth', 'true');
      setAuthError(false);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'explorer':
        return <Sidebar onFileSelect={(file) => setActiveFile(file)} />;
      case 'search':
        return <SearchPanel onFileSelect={(file) => setActiveFile(file)} />;
      case 'git':
        return <GitPanel />;
      case 'npm':
        return <NpmPanel />;
      case 'packages':
        return <PackagesPanel />;
      default:
        return <Sidebar onFileSelect={(file) => setActiveFile(file)} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#1e1e1e', padding: '40px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center', width: '320px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e2c08d', marginBottom: '5px', letterSpacing: '2px' }}>CODIA</div>
          <div style={{ fontSize: '13px', color: '#858585', marginBottom: '30px' }}>Restricted Access</div>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Enter Auth Code"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#111', border: authError ? '1px solid #f44336' : '1px solid #333', color: '#fff', borderRadius: '6px', fontSize: '14px', marginBottom: '15px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button 
              type="submit" 
              style={{ width: '100%', padding: '12px', background: '#0e639c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
            >
              Enter Workspace
            </button>
          </form>
          {authError && <div style={{ color: '#f44336', fontSize: '12px', marginTop: '15px' }}>Invalid authorization code.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <ActivityBar activeTab={activeTab} onTabSelect={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(true);
        }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar - Toggle Button */}
        <div style={{ 
          padding: '8px 12px', 
          background: '#1e1e1e', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          gap: '12px'
        }}>
          <button 
            onClick={() => setShowFullTerminal(!showFullTerminal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: showFullTerminal ? '#0e639c' : 'transparent',
              color: showFullTerminal ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <Monitor size={16} />
            {showFullTerminal ? 'Back to Editor' : 'Full Terminal Mode'}
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
          {activeTab !== 'browser' && activeTab !== 'preview' && (
            <div className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`} style={{ borderRight: '1px solid var(--border-color)', backgroundColor: '#1e1e1e', zIndex: 10 }}>
              {renderActivePanel()}
            </div>
          )}

          <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {showFullTerminal ? (
              <div style={{ flex: 1, overflow: 'hidden', background: '#000' }}>
                <Terminal fullMode={true} />
              </div>
            ) : (
              <>
                {activeTab === 'browser' ? (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <BrowserPanel />
                  </div>
                ) : activeTab === 'preview' ? (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <HtmlPreviewPanel activeFile={activeFile} />
                  </div>
                ) : (
                  <div className="editor-container">
                    <Editor activeFile={activeFile} onPreviewRequest={() => setActiveTab('preview')} />
                  </div>
                )}
                <div className="terminal-container" style={{ height: '35%', borderTop: '1px solid var(--border-color)' }}>
                  <Terminal />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
