import React, { useState, useEffect, useRef } from 'react';
import { fs } from '../utils/fileSystem';
import { Plus, FolderPlus, Trash2, RefreshCw, ChevronRight, ChevronDown, Upload, X } from 'lucide-react';
import { DiJavascript1, DiPython, DiHtml5, DiCss3, DiReact, DiSass, DiGit, DiNpm, DiMarkdown, DiJava, DiRuby, DiPhp, DiGo, DiRust, DiSwift, DiDatabase } from 'react-icons/di';
import { SiTypescript, SiVite, SiPrettier, SiEslint, SiTailwindcss } from 'react-icons/si';
import { VscFile, VscJson, VscSettingsGear, VscFileMedia, VscTerminal } from 'react-icons/vsc';
import { useModal } from '../contexts/ModalContext';

const buildFileTree = (flatFiles) => {
  const root = {};
  flatFiles.forEach(file => {
    const parts = file.path.split('/').filter(Boolean);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        const isDir = i < parts.length - 1 || file.isDirectory;
        current[part] = {
          name: part,
          path: '/' + parts.slice(0, i + 1).join('/'),
          isDirectory: isDir,
          children: {}
        };
      }
      current = current[part].children;
    }
  });
  return root;
};

// Massive Icon Mapping using React Icons
const getFileIcon = (filename) => {
  const name = filename.toLowerCase();
  
  // Specific config files
  if (name.includes('vite.config')) return <SiVite size={14} color="#646cff" />;
  if (name.includes('tailwind.config')) return <SiTailwindcss size={14} color="#38bdf8" />;
  if (name.includes('prettier')) return <SiPrettier size={14} color="#f7b93e" />;
  if (name.includes('eslint') || name === '.oxlintrc.json') return <SiEslint size={14} color="#4b32c3" />;
  if (name === 'package.json') return <DiNpm size={18} color="#cb3837" />;
  if (name === 'package-lock.json') return <VscJson size={14} color="#cb3837" />;
  if (name === '.gitignore' || name === '.npmignore') return <DiGit size={14} color="#f14e32" />;
  
  // Languages & Extensions
  if (name.endsWith('.js')) return <DiJavascript1 size={14} color="#f7df1e" />;
  if (name.endsWith('.jsx')) return <DiReact size={14} color="#61dafb" />;
  if (name.endsWith('.ts')) return <SiTypescript size={12} color="#3178c6" style={{ margin: '1px' }} />;
  if (name.endsWith('.tsx')) return <DiReact size={14} color="#3178c6" />;
  
  if (name.endsWith('.py')) return <DiPython size={14} color="#3776ab" />;
  if (name.endsWith('.java')) return <DiJava size={14} color="#b07219" />;
  if (name.endsWith('.rb')) return <DiRuby size={14} color="#701516" />;
  if (name.endsWith('.php')) return <DiPhp size={14} color="#4f5d95" />;
  if (name.endsWith('.go')) return <DiGo size={14} color="#00add8" />;
  if (name.endsWith('.rs')) return <DiRust size={14} color="#dea584" />;
  if (name.endsWith('.swift')) return <DiSwift size={14} color="#ffac45" />;
  
  if (name.endsWith('.cpp') || name.endsWith('.cxx')) return <span style={{ color: '#00599C', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>C++</span>;
  if (name.endsWith('.cs')) return <span style={{ color: '#239120', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>C#</span>;
  if (name.endsWith('.c') || name.endsWith('.h')) return <span style={{ color: '#A8B9CC', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>C</span>;
  
  if (name.endsWith('.html') || name.endsWith('.xml') || name.endsWith('.svg')) return <DiHtml5 size={14} color="#e34f26" />;
  if (name.endsWith('.css')) return <DiCss3 size={14} color="#1572B6" />;
  if (name.endsWith('.scss') || name.endsWith('.sass')) return <DiSass size={14} color="#CC6699" />;
  
  if (name.endsWith('.md') || name.endsWith('.mdx')) return <DiMarkdown size={14} color="#ffffff" />;
  if (name.endsWith('.json') || name.endsWith('rc')) return <VscJson size={14} color="#e3c43b" />;
  
  if (name.endsWith('.sql') || name.endsWith('.db') || name.endsWith('.sqlite')) return <DiDatabase size={14} color="#e38c00" />;
  
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.ico')) return <VscFileMedia size={14} color="#a074c4" />;
  if (name.endsWith('.sh') || name.endsWith('.bash') || name.endsWith('.cmd') || name.endsWith('.bat')) return <VscTerminal size={14} color="#4d5a5e" />;
  if (name.endsWith('.env')) return <VscSettingsGear size={14} color="#ebd247" />;

  // Default File
  return <VscFile size={14} color="#cccccc" />;
};

const FileTreeNode = ({ node, onFileSelect, onDelete, onContextMenu, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isDirectory) {
      onContextMenu(e, node);
    }
  };

  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });

  return (
    <div>
      <div 
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${level * 16 + 8}px`,
          cursor: 'pointer',
          background: isHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: 'var(--text-primary)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {node.isDirectory ? (
            <div onClick={toggleOpen} style={{ display: 'flex', alignItems: 'center', width: '16px', height: '16px', justifyContent: 'center', color: '#cccccc' }}>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', width: '16px', height: '16px', justifyContent: 'center' }}>
              {getFileIcon(node.name)}
            </div>
          )}
          <span style={{ color: node.isDirectory ? '#cccccc' : '#cccccc' }}>{node.name}</span>
        </div>
        
        {isHovered && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {node.isDirectory && isOpen && (
        <div>
          {childrenNodes.map(child => (
            <FileTreeNode 
              key={child.path} 
              node={child} 
              onFileSelect={onFileSelect} 
              onDelete={onDelete}
              onContextMenu={onContextMenu}
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ onFileSelect }) => {
  const [fileTree, setFileTree] = useState({});
  const [newInputName, setNewInputName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createTargetPath, setCreateTargetPath] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDestination, setUploadDestination] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const fileInputRef = useRef(null);
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    loadFiles();
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const loadFiles = async () => {
    try {
      const allFiles = await fs.listFiles();
      const tree = buildFileTree(allFiles);
      setFileTree(tree);
      setError(null);
      setErrorDetails(null);
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect to backend');
      setErrorDetails('Make sure the backend server is running on port 10000');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInputName.trim()) return;
    
    const targetPath = createTargetPath || '';
    const basePath = targetPath === '/' ? '' : targetPath;
    const path = `${basePath}/${newInputName}`.replace(/\/+/g, '/');
    
    try {
      if (isCreatingFolder) {
        await fs.createFolder(path);
        showAlert(`Folder "${newInputName}" created successfully`, { title: 'Success' });
      } else {
        await fs.writeFile(path, '// New file\n');
        showAlert(`File "${newInputName}" created successfully`, { title: 'Success' });
      }
      setNewInputName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setCreateTargetPath('');
      loadFiles();
    } catch (err) {
      showAlert(`Error: ${err.message}`, { title: 'Error' });
    }
  };

  const handleContextMenu = (e, node) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node: node
    });
  };

  const handleUploadToFolder = (folderPath) => {
    setUploadDestination(folderPath);
    setShowUploadModal(true);
    setContextMenu(null);
  };

  const handleCreateInFolder = (folderPath, type) => {
    setCreateTargetPath(folderPath);
    setUploadDestination(folderPath);
    if (type === 'folder') {
      setIsCreatingFolder(true);
      setIsCreatingFile(false);
    } else {
      setIsCreatingFile(true);
      setIsCreatingFolder(false);
    }
    setNewInputName('');
    setContextMenu(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadedFiles([]);
    const results = [];
    
    for (const file of files) {
      try {
        const result = await fs.uploadFile(file, uploadDestination);
        results.push({ name: file.name, success: true, path: result.path });
      } catch (err) {
        results.push({ name: file.name, success: false, error: err.message });
      }
    }
    
    setUploadedFiles(results);
    setIsUploading(false);
    
    if (results.every(r => r.success)) {
      loadFiles();
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (path) => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${path}?`, { title: 'Confirm Deletion' });
    if (confirmed) {
      try {
        await fs.deleteFile(path);
        loadFiles();
      } catch (err) {
        showAlert('Error deleting item', { title: 'Error' });
      }
    }
  };

  const cancelCreate = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewInputName('');
    setCreateTargetPath('');
  };

  const rootNodes = Object.values(fileTree).sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--text-primary)', background: '#181818' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px' }}>
        <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#cccccc' }}>Explorer</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadFiles} title="Refresh" style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowUploadModal(true)} title="Upload Files" style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}>
            <Upload size={14} />
          </button>
          <button onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); setNewInputName(''); }} title="New File" style={{ background: 'none', border: 'none', color: isCreatingFile ? '#0e639c' : '#cccccc', cursor: 'pointer' }}>
            <Plus size={16} />
          </button>
          <button onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); setNewInputName(''); }} title="New Folder" style={{ background: 'none', border: 'none', color: isCreatingFolder ? '#0e639c' : '#cccccc', cursor: 'pointer' }}>
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#cccccc' }}>
          <ChevronDown size={14} /> ANDROID VS
        </div>
      </div>

      {error && (
        <div style={{ 
          color: '#f85149', 
          fontSize: '12px', 
          padding: '12px 15px', 
          marginBottom: '10px',
          background: 'rgba(248, 81, 73, 0.1)',
          borderRadius: '4px',
          margin: '0 15px 10px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{error}</div>
          {errorDetails && <div style={{ color: '#858585', fontSize: '11px' }}>{errorDetails}</div>}
          <button 
            onClick={loadFiles}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              background: '#0e639c',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {(isCreatingFile || isCreatingFolder) && (
        <div style={{ padding: '0 15px', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#858585', marginBottom: '6px' }}>
            {isCreatingFile ? 'Create New File' : 'Create New Folder'}
            {createTargetPath && (
              <span style={{ color: '#0e639c', marginLeft: '8px' }}>
                in {createTargetPath}
              </span>
            )}
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '6px' }}>
            <input 
              autoFocus
              type="text" 
              placeholder={isCreatingFolder ? "folderName" : "filename.js"}
              value={newInputName}
              onChange={(e) => setNewInputName(e.target.value)}
              style={{ 
                flex: 1,
                padding: '6px 8px', 
                background: '#3c3c3c', 
                border: '1px solid #007fd4', 
                color: 'white', 
                borderRadius: '4px', 
                outline: 'none', 
                fontSize: '13px' 
              }}
            />
            <button 
              type="button"
              onClick={cancelCreate}
              style={{
                padding: '6px 8px',
                background: '#3c3c3c',
                border: '1px solid #555',
                color: '#ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <X size={14} />
            </button>
            <button 
              type="submit"
              style={{
                padding: '6px 12px',
                background: '#0e639c',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Create
            </button>
          </form>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rootNodes.length === 0 && !error ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>No files found</div>
        ) : (
          rootNodes.map(node => (
            <FileTreeNode 
              key={node.path} 
              node={node} 
              onFileSelect={onFileSelect} 
              onDelete={handleDelete}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {/* Context Menu for Folders */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '6px',
            padding: '6px 0',
            minWidth: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1000
          }}
        >
          <div style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            color: '#888',
            borderBottom: '1px solid #444',
            marginBottom: '4px'
          }}>
            📁 {contextMenu.node.name}
          </div>
          <button
            onClick={() => handleUploadToFolder(contextMenu.node.path)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              color: '#ccc',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3c3c3c'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <Upload size={14} /> Upload Files Here
          </button>
          <button
            onClick={() => handleCreateInFolder(contextMenu.node.path, 'file')}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              color: '#ccc',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3c3c3c'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <Plus size={14} /> New File
          </button>
          <button
            onClick={() => handleCreateInFolder(contextMenu.node.path, 'folder')}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'none',
              border: 'none',
              color: '#ccc',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#3c3c3c'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <FolderPlus size={14} /> New Folder
          </button>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#ccc', fontSize: '16px' }}>Upload Files</h3>
              <button 
                onClick={() => { setShowUploadModal(false); setUploadedFiles([]); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                Destination folder (optional)
              </label>
              <input
                type="text"
                placeholder="/ or /folderName"
                value={uploadDestination}
                onChange={(e) => setUploadDestination(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#2d2d2d',
                border: '2px dashed #444',
                borderRadius: '8px',
                color: '#888',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={24} />
              {isUploading ? 'Uploading...' : 'Click to select files or drag & drop'}
            </button>

            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Upload Results:</div>
                {uploadedFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '8px',
                      background: file.success ? 'rgba(46, 160, 67, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: file.success ? '#3fb950' : '#f85149'
                    }}
                  >
                    {file.name}: {file.success ? `Uploaded to ${file.path}` : file.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
