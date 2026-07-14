import React, { useState, useEffect } from 'react';

const HtmlPreviewPanel = ({ activeFile }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (activeFile) {
      setUrl(`/workspace\( {activeFile}?t= \){Date.now()}`);
    }
  }, [activeFile]);

  if (!activeFile) return <div>Select an HTML file</div>;

  return (
    <iframe 
      src={url} 
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="Preview"
    />
  );
};

export default HtmlPreviewPanel;
