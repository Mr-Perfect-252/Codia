import React, { useState, useEffect } from 'react';
import { GitCommit, RefreshCw, Check, Upload, Download, Trash2, Undo2 } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';

const GitPanel = () => {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useModal();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/git/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCommit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await fetch('http://localhost:3000/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      setMessage('');
      fetchStatus();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/git/push', { method: 'POST' });
      const data = await res.json();
      if (data.error) showAlert(data.error, { title: 'Push Failed', icon: 'error' });
      else showAlert('Successfully pushed commits to remote repository.', { title: 'Push Successful', icon: 'success' });
    } catch (e) {
      showAlert('A network error occurred while pushing.', { title: 'Push Failed', icon: 'error' });
    }
    setLoading(false);
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/git/pull', { method: 'POST' });
      const data = await res.json();
      if (data.error) showAlert(data.error, { title: 'Pull Failed', icon: 'error' });
      else {
        showAlert('Successfully pulled latest changes from remote repository.', { title: 'Pull Successful', icon: 'success' });
        fetchStatus();
      }
    } catch (e) {
      showAlert('A network error occurred while pulling.', { title: 'Pull Failed', icon: 'error' });
    }
    setLoading(false);
  };

  const handleClearCache = async () => {
    const confirmed = await showConfirm('This will unstage all files (git rm -r --cached .). Are you sure you want to continue?', { title: 'Clear Git Cache' });
    if (!confirmed) return;
    setLoading(true);
    try {
      await fetch('http://localhost:3000/api/git/clear-cache', { method: 'POST' });
      showAlert('Git cache has been cleared and all files unstaged.', { title: 'Cache Cleared', icon: 'success' });
      fetchStatus();
    } catch (e) {
      showAlert('Failed to clear git cache.', { title: 'Error', icon: 'error' });
    }
    setLoading(false);
  };

  const handleUndoCommit = async () => {
    const confirmed = await showConfirm('Undo the last commit? Your file changes will be kept safely in your working directory.', { title: 'Undo Commit' });
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/git/undo-commit', { method: 'POST' });
      const data = await res.json();
      if (data.error) showAlert(data.error, { title: 'Undo Failed', icon: 'error' });
      else {
        showAlert('Your last commit was successfully undone.', { title: 'Commit Undone', icon: 'success' });
        fetchStatus();
      }
    } catch (e) {
      showAlert('Failed to undo the last commit.', { title: 'Error', icon: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ textTransform: 'uppercase', fontSize: '11px', color: '#858585', letterSpacing: '0.05em' }}>
          Source Control
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={handleUndoCommit} disabled={loading} title="Undo Last Commit (Keep Changes)" style={{ background: 'none', border: 'none', color: '#e2c08d', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <Undo2 size={14} />
          </button>
          <button onClick={handleClearCache} disabled={loading} title="Clear Git Cache (Unstage All)" style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <Trash2 size={14} />
          </button>
          <button onClick={handlePull} disabled={loading} title="Pull" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <Download size={14} />
          </button>
          <button onClick={handlePush} disabled={loading} title="Push" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <Upload size={14} />
          </button>
          <button onClick={fetchStatus} disabled={loading} title="Refresh" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      
      {status && status.error ? (
        <div style={{ color: '#f44336', fontSize: '12px' }}>{status.error}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexDirection: 'column' }}>
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message (Ctrl+Enter to commit)"
              style={{ 
                width: '100%', 
                background: '#1e1e1e', 
                border: '1px solid #333', 
                color: '#ccc', 
                padding: '5px', 
                borderRadius: '2px',
                fontSize: '13px'
              }}
            />
            <button 
              onClick={handleCommit}
              disabled={loading || !message.trim()}
              style={{
                width: '100%',
                background: '#0e639c',
                color: 'white',
                border: 'none',
                padding: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !message.trim() ? 0.7 : 1,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Check size={14} /> Commit
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#cccccc', marginBottom: '5px', textTransform: 'uppercase' }}>Changes</div>
            {loading ? (
              <div style={{ fontSize: '12px', color: '#888' }}>Checking status...</div>
            ) : status?.modified?.length === 0 && status?.untracked?.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#888' }}>No changes</div>
            ) : (
              <div style={{ fontSize: '13px', color: '#ccc' }}>
                {status?.modified?.map(f => (
                  <div key={f} style={{ color: '#e2c08d' }}>M  {f}</div>
                ))}
                {status?.untracked?.map(f => (
                  <div key={f} style={{ color: '#73c991' }}>U  {f}</div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GitPanel;
