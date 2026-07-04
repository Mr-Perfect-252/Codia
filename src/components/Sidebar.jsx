import React, { useState, useEffect } from 'react';
import { fs } from '../utils/fileSystem';
import { Plus, FolderPlus, Trash2, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
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

const FileTreeNode = ({ node, onFileSelect, onDelete, level = 0 }) => {
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

  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });

  return (
    <div>
      <div 
        onClick={handleClick}
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
  const [error, setError] = useState(null);
  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const allFiles = await fs.listFiles();
      const tree = buildFileTree(allFiles);
      setFileTree(tree);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInputName.trim()) return;
    
    const path = `/${newInputName}`;
    try {
      if (isCreatingFolder) {
        await fs.createFolder(path);
      } else {
        await fs.writeFile(path, '// New file\n');
      }
      setNewInputName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      loadFiles();
    } catch (err) {
      showAlert(`Error creating ${isCreatingFolder ? 'folder' : 'file'}`, { title: 'Error' });
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
          <button onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); }} title="New File" style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}>
            <Plus size={16} />
          </button>
          <button onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); }} title="New Folder" style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}>
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#cccccc' }}>
          <ChevronDown size={14} /> ANDROID VS
        </div>
      </div>

      {error && <div style={{ color: '#f85149', fontSize: '12px', padding: '0 15px', marginBottom: '10px' }}>{error}</div>}

      {(isCreatingFile || isCreatingFolder) && (
        <form onSubmit={handleCreate} style={{ padding: '0 15px', marginBottom: '10px' }}>
          <input 
            autoFocus
            type="text" 
            placeholder={isCreatingFolder ? "folderName" : "filename.js"}
            value={newInputName}
            onChange={(e) => setNewInputName(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', background: '#3c3c3c', border: '1px solid #007fd4', color: 'white', borderRadius: '2px', outline: 'none', fontSize: '13px' }}
          />
        </form>
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
