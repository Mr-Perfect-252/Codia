import React, { useState } from 'react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar'; // This is now just the Explorer Panel
import Terminal from './components/Terminal';
import ActivityBar from './components/ActivityBar';
import SearchPanel from './components/SearchPanel';
import GitPanel from './components/GitPanel';
import PackagesPanel from './components/PackagesPanel';
import NpmPanel from './components/NpmPanel';
import BrowserPanel from './components/BrowserPanel';
import HtmlPreviewPanel from './components/HtmlPreviewPanel';
import { Menu } from 'lucide-react';
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
      
      {/* Activity Bar (VS Code left-most strip) */}
      <div style={{ flexShrink: 0 }}>
        <ActivityBar activeTab={activeTab} onTabSelect={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(true); // Open sidebar if it was closed on mobile
        }} />
      </div>

      {/* Main Layout Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Top Bar */}
        <div className="mobile-top-bar" style={{ display: 'none', padding: '10px', background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
          <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
            <Menu />
          </button>
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>Codia Mobile</span>
        </div>

        <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
          {/* Dynamic Sidebar Panel */}
          {activeTab !== 'browser' && activeTab !== 'preview' && (
            <div className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`} style={{ borderRight: '1px solid var(--border-color)', backgroundColor: '#1e1e1e', zIndex: 10 }}>
              {renderActivePanel()}
            </div>
          )}

          {/* Main Content Area */}
          <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
            <div className="terminal-container">
              <Terminal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
