import React, { useState, useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { fs } from '../utils/fileSystem';
import { Play, Eye, Key, Globe } from 'lucide-react';
import RunnerDialog from './RunnerDialog';
import VisualizerDialog from './VisualizerDialog';
import GitCredentialsDialog from './GitCredentialsDialog';

const Editor = ({ activeFile, onPreviewRequest }) => {
  const [content, setContent] = useState('// Select a file from the explorer to start coding\n');
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (activeFile) {
      fs.readFile(activeFile).then(fileContent => {
        setContent(fileContent);
      }).catch(err => {
        console.error(err);
        setContent('// Error loading file');
      });
    } else {
      setContent('// Select a file from the explorer to start coding\n');
    }
  }, [activeFile]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleChange = (value) => {
    if (activeFile) {
      fs.writeFile(activeFile, value);
    }
    setContent(value);
  };

  const getLanguage = (path) => {
    if (!path) return 'javascript';
    const name = path.toLowerCase();
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'typescript';
    if (name.endsWith('.py')) return 'python';
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.html')) return 'html';
    if (name.endsWith('.css')) return 'css';
    if (name.endsWith('.md')) return 'markdown';
    if (name.endsWith('.java')) return 'java';
    if (name.endsWith('.go')) return 'go';
    if (name.endsWith('.rs')) return 'rust';
    if (name.endsWith('.cpp') || name.endsWith('.c')) return 'cpp';
    if (name.endsWith('.cs')) return 'csharp';
    return 'javascript';
  };

  // Determine if the current file can be run by our backend
  const isRunnable = activeFile && (activeFile.endsWith('.py') || activeFile.endsWith('.js') || activeFile.endsWith('.sh'));
  // Determine if the file can be run by the Visualizer (Skulpt for Python)
  const isVisualizable = activeFile && activeFile.endsWith('.py');
  // Determine if file is HTML for preview
  const isHtml = activeFile && activeFile.toLowerCase().endsWith('.html');

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 15px', background: 'var(--panel-bg)', fontSize: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {activeFile ? activeFile.replace(/^\//, '') : 'No file selected'}
        </span>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {!activeFile && (
            <button 
              onClick={() => setIsCredentialsOpen(true)}
              title="Manage Git Credentials"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#e2c08d',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(226, 192, 141, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Key size={14} fill="#e2c08d" /> Credentials
            </button>
          )}

          {isVisualizable && (
            <button 
              onClick={() => setIsVisualizerOpen(true)}
              title="Visualize Python Script locally (Skulpt)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#2196F3',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Eye size={14} fill="#2196F3" /> Visualize
            </button>
          )}

          {isHtml && (
            <button 
              onClick={onPreviewRequest}
              title="Live Preview HTML"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#e2c08d',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(226, 192, 141, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Eye size={14} /> Preview
            </button>
          )}

          {isRunnable && (
            <button 
              onClick={() => setIsRunnerOpen(true)}
              title="Run Script on Server"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#4caf50',
                cursor: 'pointer',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(76, 175, 80, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Play size={14} fill="#4caf50" /> Run
            </button>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          language={getLanguage(activeFile)}
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10 }
          }}
        />
      </div>

      {isRunnerOpen && (
        <RunnerDialog file={activeFile.replace(/^\//, '')} onClose={() => setIsRunnerOpen(false)} />
      )}

      {isVisualizerOpen && (
        <VisualizerDialog file={activeFile.replace(/^\//, '')} code={content} onClose={() => setIsVisualizerOpen(false)} />
      )}

      {isCredentialsOpen && (
        <GitCredentialsDialog onClose={() => setIsCredentialsOpen(false)} />
      )}
    </div>
  );
};

export default Editor;
