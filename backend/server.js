const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');
const CREDENTIALS_FILE = path.join(process.cwd(), '.git-credentials.json');

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const destDir = req.body.destination || '';
    const fullDestPath = path.join(WORKSPACE_DIR, destDir);
    try {
      await fs.mkdir(fullDestPath, { recursive: true });
      cb(null, fullDestPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve workspace files with proper MIME types and CORS
app.use('/workspace', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  express.static(WORKSPACE_DIR)(req, res, next);
});

// Ensure workspace directory exists
async function ensureWorkspace() {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  } catch (e) {}
}
ensureWorkspace();

// ============ FILE SYSTEM APIs ============

// List files - GET /api/files or /api/files/list
app.get('/api/files', async (req, res) => {
  try {
    const dir = req.query.dir || '';
    const fullPath = path.join(WORKSPACE_DIR, dir);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const items = await fs.readdir(fullPath);
    const list = await Promise.all(items.map(async (name) => {
      const stat = await fs.stat(path.join(fullPath, name));
      return { name, isDirectory: stat.isDirectory(), path: path.join(dir, name) };
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Alias for compatibility
app.get('/api/files/list', (req, res) => app._router.handle(req, res));

// Read file - GET /api/files/read?path=/filename
app.get('/api/files/read', async (req, res) => {
  try {
    const filePath = path.join(WORKSPACE_DIR, req.query.path || '');
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Write file - POST /api/files/write
app.post('/api/files/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.writeFile(fullPath, content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create folder - POST /api/files/mkdir
app.post('/api/files/mkdir', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, filePath);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.mkdir(fullPath, { recursive: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload file - POST /api/files/upload
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const uploadedPath = '/' + path.relative(WORKSPACE_DIR, req.file.path);
    res.json({ 
      success: true, 
      filename: req.file.originalname,
      path: uploadedPath,
      size: req.file.size
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete file/folder - DELETE /api/files/delete?path=/filename
app.delete('/api/files/delete', async (req, res) => {
  try {
    const filePath = path.join(WORKSPACE_DIR, req.query.path || '');
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ SEARCH API ============

// Search files - GET /api/search?q=query
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    if (!query) {
      return res.json({ results: [] });
    }

    const results = [];
    
    // Recursive function to search through files
    async function searchDir(dir) {
      try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          // Skip hidden files and node_modules
          if (item.name.startsWith('.') || item.name === 'node_modules') {
            continue;
          }
          
          if (item.isDirectory()) {
            await searchDir(fullPath);
          } else {
            // Search in text files
            const ext = path.extname(item.name).toLowerCase();
            const searchableExts = ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md', '.txt', '.sh'];
            
            if (searchableExts.includes(ext)) {
              try {
                const content = await fs.readFile(fullPath, 'utf8');
                const lines = content.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                  if (lines[i].toLowerCase().includes(query)) {
                    const relativePath = '/' + path.relative(WORKSPACE_DIR, fullPath);
                    results.push({
                      file: relativePath,
                      line: i + 1,
                      lineContent: lines[i].substring(0, 200)
                    });
                    
                    // Limit results per file
                    if (results.filter(r => r.file === relativePath).length >= 5) {
                      break;
                    }
                  }
                }
              } catch (e) {
                // Skip files that can't be read
              }
            }
          }
        }
      } catch (e) {
        // Skip directories that can't be read
      }
    }
    
    await searchDir(WORKSPACE_DIR);
    
    // Sort by relevance (files with more matches first)
    results.sort((a, b) => {
      const aMatches = results.filter(r => r.file === a.file).length;
      const bMatches = results.filter(r => r.file === b.file).length;
      return bMatches - aMatches;
    });
    
    res.json({ results: results.slice(0, 50) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ RUN CODE API ============

// Run code - POST /api/run
app.post('/api/run', async (req, res) => {
  try {
    const { file } = req.body;
    const fullPath = path.join(WORKSPACE_DIR, file);
    
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const ext = path.extname(file).toLowerCase();
    let cmd;
    
    switch (ext) {
      case '.js':
        cmd = spawn('node', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      case '.py':
        cmd = spawn('python', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      case '.sh':
        cmd = spawn('bash', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      default:
        return res.status(400).json({ error: `Unsupported file type: ${ext}` });
    }
    
    let stdout = '';
    let stderr = '';
    
    cmd.stdout.on('data', (data) => { stdout += data; });
    cmd.stderr.on('data', (data) => { stderr += data; });
    
    cmd.on('close', (code) => {
      res.json({ stdout, stderr, exitCode: code });
    });
    
    cmd.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ NPM APIs ============

// Install global npm package - POST /api/npm/install-global
app.post('/api/npm/install-global', (req, res) => {
  const { packageName } = req.body;
  if (!packageName) {
    return res.status(400).json({ error: 'Package name required' });
  }
  
  exec(`npm install -g ${packageName}`, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ error: stderr || error.message });
    }
    res.json({ message: `Successfully installed ${packageName}`, output: stdout });
  });
});

// Search npm registry - GET /api/npm/search?q=package
app.get('/api/npm/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const response = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to search NPM registry' });
  }
});

// ============ SYSTEM APIs ============

// Check installed tools - GET /api/system/check
app.get('/api/system/check', (req, res) => {
  const tools = {};
  const checkTool = (name, cmd) => {
    return new Promise((resolve) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          tools[name.toLowerCase()] = { installed: false, version: null };
        } else {
          const version = stdout.trim().split('\n')[0];
          tools[name.toLowerCase()] = { installed: true, version };
        }
        resolve();
      });
    });
  };

  Promise.all([
    checkTool('git', 'git --version'),
    checkTool('node', 'node --version'),
    checkTool('npm', 'npm --version'),
    checkTool('yarn', 'yarn --version'),
    checkTool('bun', 'bun --version'),
    checkTool('pnpm', 'pnpm --version'),
    checkTool('python', 'python --version'),
    checkTool('pip', 'pip --version'),
    checkTool('docker', 'docker --version'),
  ]).then(() => res.json(tools));
});

// Install system tool - POST /api/system/install
app.post('/api/system/install', (req, res) => {
  const { tool } = req.body;
  
  const installCommands = {
    bun: 'npm install -g bun',
    pnpm: 'npm install -g pnpm',
    yarn: 'npm install -g yarn',
  };
  
  const cmd = installCommands[tool.toLowerCase()];
  if (!cmd) {
    return res.json({ error: `Cannot auto-install ${tool}. Please install manually.` });
  }
  
  exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ error: stderr || error.message });
    }
    res.json({ message: `${tool} installed successfully`, output: stdout });
  });
});

// ============ GIT APIs ============

// Load git credentials
const loadCredentials = async () => {
  try {
    const data = await fs.readFile(CREDENTIALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { name: '', email: '', pat: '', repoUrl: '' };
  }
};

// Save git credentials
const saveCredentials = async (creds) => {
  await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
  // Add to .gitignore if not already there
  try {
    const gitignorePath = path.join(WORKSPACE_DIR, '.gitignore');
    let gitignore = '';
    try {
      gitignore = await fs.readFile(gitignorePath, 'utf8');
    } catch (e) {}
    
    if (!gitignore.includes('.git-credentials.json')) {
      gitignore += '\n.git-credentials.json\n';
      await fs.writeFile(gitignorePath, gitignore);
    }
  } catch (e) {}
};

// Get git status - GET /api/git/status
app.get('/api/git/status', async (req, res) => {
  try {
    const creds = await loadCredentials();
    
    if (!creds.repoUrl) {
      return res.json({ error: 'No repository configured. Please set up Git credentials first.' });
    }
    
    exec('git status --porcelain', { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
      if (error) {
        // Not a git repo
        exec('git init', { cwd: WORKSPACE_DIR }, (initErr) => {
          if (initErr) {
            return res.json({ error: 'Not a git repository and failed to initialize' });
          }
          return res.json({ modified: [], untracked: [], message: 'Initialized new git repository' });
        });
        return;
      }
      
      const lines = stdout.trim().split('\n').filter(Boolean);
      const modified = [];
      const untracked = [];
      
      lines.forEach(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        
        if (status.includes('M')) modified.push(file);
        if (status.includes('?')) untracked.push(file);
      });
      
      res.json({ modified, untracked });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get git credentials - GET /api/git/credentials
app.get('/api/git/credentials', async (req, res) => {
  const creds = await loadCredentials();
  res.json(creds);
});

// Configure git credentials - POST /api/git/config
app.post('/api/git/config', async (req, res) => {
  try {
    const { name, email, pat, repoUrl } = req.body;
    const creds = { name, email, pat, repoUrl };
    
    await saveCredentials(creds);
    
    // Configure git user if provided
    if (name && email) {
      exec(`git config user.name "${name}"`, { cwd: WORKSPACE_DIR });
      exec(`git config user.email "${email}"`, { cwd: WORKSPACE_DIR });
    }
    
    // Set up remote if repo URL provided
    if (repoUrl) {
      let remoteUrl = repoUrl;
      if (pat) {
        // Insert PAT into URL for HTTPS authentication
        remoteUrl = repoUrl.replace('https://', `https://${pat}@`);
      }
      exec(`git remote remove origin 2>/dev/null; git remote add origin ${remoteUrl}`, { cwd: WORKSPACE_DIR });
    }
    
    res.json({ success: true, message: 'Git credentials configured successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Git commit - POST /api/git/commit
app.post('/api/git/commit', async (req, res) => {
  try {
    const { message } = req.body;
    
    exec(`git add . && git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
      if (error) {
        return res.json({ error: stderr || error.message });
      }
      res.json({ success: true, output: stdout });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Git push - POST /api/git/push
app.post('/api/git/push', async (req, res) => {
  try {
    const creds = await loadCredentials();
    
    if (!creds.repoUrl) {
      return res.json({ error: 'No repository configured. Please set up Git credentials first.' });
    }
    
    // Set up remote with PAT if available
    if (creds.pat && creds.repoUrl) {
      const remoteUrl = creds.repoUrl.replace('https://', `https://${creds.pat}@`);
      exec(`git remote set-url origin ${remoteUrl}`, { cwd: WORKSPACE_DIR });
    }
    
    exec('git push -u origin HEAD', { cwd: WORKSPACE_DIR, timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        return res.json({ error: stderr || error.message });
      }
      res.json({ success: true, output: stdout });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Git pull - POST /api/git/pull
app.post('/api/git/pull', async (req, res) => {
  try {
    const creds = await loadCredentials();
    
    if (!creds.repoUrl) {
      return res.json({ error: 'No repository configured. Please set up Git credentials first.' });
    }
    
    // Set up remote with PAT if available
    if (creds.pat && creds.repoUrl) {
      const remoteUrl = creds.repoUrl.replace('https://', `https://${creds.pat}@`);
      exec(`git remote set-url origin ${remoteUrl}`, { cwd: WORKSPACE_DIR });
    }
    
    exec('git pull origin HEAD', { cwd: WORKSPACE_DIR, timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        return res.json({ error: stderr || error.message });
      }
      res.json({ success: true, output: stdout });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Clear git cache - POST /api/git/clear-cache
app.post('/api/git/clear-cache', (req, res) => {
  exec('git rm -r --cached .', { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ error: stderr || error.message });
    }
    res.json({ success: true, output: stdout });
  });
});

// Undo last commit - POST /api/git/undo-commit
app.post('/api/git/undo-commit', (req, res) => {
  exec('git reset HEAD~1', { cwd: WORKSPACE_DIR }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ error: stderr || error.message });
    }
    res.json({ success: true, output: stdout });
  });
});

// ============ WEBSOCKET SERVER FOR TERMINAL ============

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Terminal sessions management
const terminalSessions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Create a new PTY process for this terminal session
  let ptyProcess = null;
  
  // Try to use node-pty if available, otherwise use spawn
  try {
    const pty = require('node-pty');
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: WORKSPACE_DIR,
      env: process.env
    });
    
    ptyProcess.onData((data) => {
      socket.emit('terminal.incomingData', data);
    });
    
    ptyProcess.onExit(({ exitCode }) => {
      socket.emit('terminal.exit', exitCode);
    });
    
    terminalSessions.set(socket.id, { pty: ptyProcess, type: 'pty' });
  } catch (e) {
    // node-pty not available, use spawn with pty fallback
    console.log('node-pty not available, using spawn fallback');
    
    const shell = os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash';
    const childProcess = spawn(shell, [], {
      cwd: WORKSPACE_DIR,
      env: process.env,
      shell: true
    });
    
    childProcess.stdout.on('data', (data) => {
      socket.emit('terminal.incomingData', data.toString());
    });
    
    childProcess.stderr.on('data', (data) => {
      socket.emit('terminal.incomingData', data.toString());
    });
    
    childProcess.on('close', (code) => {
      socket.emit('terminal.exit', code);
    });
    
    childProcess.on('error', (err) => {
      socket.emit('terminal.incomingData', `Error: ${err.message}\r\n`);
    });
    
    terminalSessions.set(socket.id, { process: childProcess, type: 'spawn' });
  }
  
  // Handle terminal input
  socket.on('terminal.keystroke', (data) => {
    const session = terminalSessions.get(socket.id);
    if (session) {
      if (session.type === 'pty' && session.pty) {
        session.pty.write(data);
      } else if (session.process) {
        session.process.stdin.write(data);
      }
    }
  });
  
  // Handle terminal resize
  socket.on('terminal.resize', ({ cols, rows }) => {
    const session = terminalSessions.get(socket.id);
    if (session && session.type === 'pty' && session.pty) {
      session.pty.resize(cols, rows);
    }
  });
  
  // Handle runner start
  socket.on('runner.start', ({ file }) => {
    const fullPath = path.join(WORKSPACE_DIR, file);
    const ext = path.extname(file).toLowerCase();
    
    let cmd;
    switch (ext) {
      case '.js':
        cmd = spawn('node', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      case '.py':
        cmd = spawn('python', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      case '.sh':
        cmd = spawn('bash', [fullPath], { cwd: WORKSPACE_DIR });
        break;
      default:
        socket.emit('runner.incomingData', `Unsupported file type: ${ext}\r\n`);
        return;
    }
    
    cmd.stdout.on('data', (data) => {
      socket.emit('runner.incomingData', data.toString());
    });
    
    cmd.stderr.on('data', (data) => {
      socket.emit('runner.incomingData', data.toString());
    });
    
    cmd.on('close', (code) => {
      socket.emit('runner.incomingData', `\r\n[Process exited with code ${code}]\r\n`);
      socket.emit('runner.exit', code);
    });
    
    // Store runner process to allow killing
    terminalSessions.set(socket.id + '_runner', cmd);
  });
  
  // Handle runner kill
  socket.on('runner.kill', () => {
    const runner = terminalSessions.get(socket.id + '_runner');
    if (runner) {
      runner.kill();
      terminalSessions.delete(socket.id + '_runner');
    }
  });
  
  // Handle runner keystroke (for interactive programs)
  socket.on('runner.keystroke', (data) => {
    const runner = terminalSessions.get(socket.id + '_runner');
    if (runner && runner.stdin) {
      runner.stdin.write(data);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    const session = terminalSessions.get(socket.id);
    if (session) {
      if (session.pty) {
        session.pty.kill();
      } else if (session.process) {
        session.process.kill();
      }
      terminalSessions.delete(socket.id);
    }
    
    // Clean up runner if exists
    const runner = terminalSessions.get(socket.id + '_runner');
    if (runner) {
      runner.kill();
      terminalSessions.delete(socket.id + '_runner');
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Codia Backend running on http://localhost:${PORT}`);
  console.log(`📁 Workspace: ${WORKSPACE_DIR}`);
});
