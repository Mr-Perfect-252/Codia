import React, { useState, useEffect, useRef } from 'react';

const HtmlPreviewPanel = ({ activeFile }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);
  const baseUrl = window.location.origin;

  useEffect(() => {
    if (activeFile && activeFile.toLowerCase().endsWith('.html')) {
      loadHtmlContent();
    }
  }, [activeFile]);

  const loadHtmlContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the raw HTML file
      const filePath = activeFile.startsWith('/') ? activeFile.slice(1) : activeFile;
      const response = await fetch(`/api/files/read?path=${encodeURIComponent('/' + filePath)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load HTML file');
      }
      
      const data = await response.json();
      let html = data.content;
      
      // Process relative URLs in the HTML to point to our backend
      // Replace relative src and href attributes
      const basePath = '/' + filePath.split('/').slice(0, -1).join('/');
      
      // Update relative src attributes (scripts, images, etc.)
      html = html.replace(/(src|href|action)=["'](?!http|data:|tel:|mailto:)([^"']+)["']/gi, (match, attr, url) => {
        if (url.startsWith('/')) {
          // Absolute path from workspace root
          return `${attr}="${baseUrl}/workspace${url}"`;
        } else {
          // Relative path
          const fullPath = basePath === '/workspace' || basePath === '' 
            ? `/workspace/${url}` 
            : `/workspace${basePath}/${url}`;
          return `${attr}="${baseUrl}${fullPath}"`;
        }
      });
      
      // Update stylesheet links
      html = html.replace(/<link[^>]+href=["'](?!http|data:)([^"']+)["'][^>]*>/gi, (match, href) => {
        let newHref = href;
        if (href.startsWith('/')) {
          newHref = `${baseUrl}/workspace${href}`;
        } else {
          const fullPath = basePath === '/workspace' || basePath === '' 
            ? `/workspace/${href}` 
            : `/workspace${basePath}/${href}`;
          newHref = `${baseUrl}${fullPath}`;
        }
        return match.replace(href, newHref);
      });
      
      setHtmlContent(html);
    } catch (err) {
      console.error('Error loading HTML:', err);
      setError(err.message);
    }
    
    setLoading(false);
  };

  const handleRefresh = () => {
    loadHtmlContent();
  };

  if (!activeFile) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#1e1e1e',
        color: '#858585'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <div style={{ fontSize: '16px' }}>Select an HTML file to preview</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        padding: '8px 12px', 
        background: '#252526', 
        borderBottom: '1px solid #333' 
      }}>
        <button 
          onClick={handleRefresh}
          style={{
            background: '#0e639c',
            border: 'none',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ↻ Refresh
        </button>
        <span style={{ fontSize: '12px', color: '#858585' }}>
          {activeFile}
        </span>
      </div>
      
      {/* Preview */}
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#1e1e1e',
            color: '#fff'
          }}>
            Loading...
          </div>
        )}
        
        {error && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#1e1e1e',
            color: '#f44336',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
            <div>{error}</div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="HTML Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default HtmlPreviewPanel;
