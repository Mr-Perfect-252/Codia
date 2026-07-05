import React, { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';

const GitCredentialsDialog = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pat, setPat] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch('/api/git/credentials');
        const data = await res.json();
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.pat) setPat(data.pat);
        if (data.repoUrl) setRepoUrl(data.repoUrl);
      } catch (e) {
        console.error('Failed to load saved credentials');
      }
    };
    fetchCredentials();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setStatus('Saving credentials...');
    try {
      const res = await fetch('/api/git/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, pat, repoUrl })
      });
      const data = await res.json();
      if (data.error) {
        setStatus('Error: ' + data.error);
      } else {
        setStatus('Credentials saved successfully!');
        setTimeout(onClose, 1500);
      }
    } catch (e) {
      setStatus('Failed to save credentials.');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    background: '#1e1e1e',
    border: '1px solid #333',
    color: '#ccc',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '15px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#ccc',
    marginBottom: '5px',
    fontWeight: 'bold'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '450px',
        backgroundColor: '#181818',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 15px',
          backgroundColor: '#252526',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cccccc', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Key size={14} /> Git Credentials Manager
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: '1.4' }}>
            Configure your local Git user profile and set a Personal Access Token (PAT) so you can Push and Pull from remote repositories (like GitHub) directly from this app.
          </div>

          <label style={labelStyle}>Git Username</label>
          <input 
            type="text" 
            placeholder="e.g. John Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle} 
          />

          <label style={labelStyle}>Git Email</label>
          <input 
            type="email" 
            placeholder="e.g. john@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle} 
          />

          <label style={labelStyle}>GitHub Personal Access Token (Optional)</label>
          <input 
            type="password" 
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
            value={pat}
            onChange={e => setPat(e.target.value)}
            style={inputStyle} 
          />

          <label style={labelStyle}>Remote Repository URL (Required if setting PAT)</label>
          <input 
            type="text" 
            placeholder="https://github.com/username/repo.git"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            style={{...inputStyle, marginBottom: '25px'}} 
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: status.includes('Error') || status.includes('Failed') ? '#f44336' : '#4caf50' }}>
              {status}
            </span>
            <button 
              onClick={handleSave}
              disabled={loading}
              style={{
                background: '#0e639c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitCredentialsDialog;
