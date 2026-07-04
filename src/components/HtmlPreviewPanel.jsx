import React, { useState, useEffect } from 'react';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import { fs } from '../utils/fileSystem';

const HtmlPreviewPanel = ({ activeFile }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHtml = async () => {
    if (!activeFile) {
      setHtmlContent('');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const content = await fs.readFile(activeFile);
      setHtmlContent(content);
    } catch (err) {
      setError('Failed to load HTML file for preview.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHtml();
  }, [activeFile]);

  if (!activeFile || !activeFile.toLowerCase().endsWith('.html')) {
    return (
      <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#858585', textAlign: 'center' }}>
        <Eye size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 10px 0', color: '#ccc' }}>No HTML File Selected</h3>
        <p style={{ fontSize: '13px' }}>Open an .html file in the Explorer and click the Preview button to see it here.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      <div style={{ padding: '10px 15px', background: 'var(--panel-bg)', fontSize: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc' }}>
          <Eye size={14} /> Live Preview: <span style={{ fontWeight: 'bold', color: '#e2c08d' }}>{activeFile.replace(/^\//, '')}</span>
        </div>
        
        <button onClick={loadHtml} title="Refresh Preview" style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {loading ? <Loader2 size={14} className="lucide-spin" /> : <RefreshCw size={14} />} 
        </button>
      </div>

      <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '20px', color: '#f44336' }}>{error}</div>
        ) : (
          <iframe 
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="HTML Live Preview"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
};

export default HtmlPreviewPanel;
