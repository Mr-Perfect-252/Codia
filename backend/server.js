const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const WORKSPACE_DIR = process.cwd();

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// Map of socket.id -> active runner process
const activeRunners = new Map();

io.on('connection', (socket) => {
  // ----------------------------------------------------
  // Main Terminal Logic
  // ----------------------------------------------------
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: WORKSPACE_DIR,
    env: process.env
  });

  ptyProcess.onData((data) => socket.emit('terminal.incomingData', data));
  socket.on('terminal.keystroke', (data) => ptyProcess.write(data));
  socket.on('terminal.resize', (size) => {
    try { ptyProcess.resize(size.cols, size.rows); } catch (e) {}
  });

  // ----------------------------------------------------
  // Code Runner Dialog Logic
  // ----------------------------------------------------
  socket.on('runner.start', (filePath) => {
    // Kill any existing runner for this socket
    if (activeRunners.has(socket.id)) {
      activeRunners.get(socket.id).kill();
      activeRunners.delete(socket.id);
    }

    const ext = path.extname(filePath).toLowerCase();
    let runnerCmd = '';
    let runnerArgs = [];

    if (ext === '.py') {
      runnerCmd = 'python';
      runnerArgs = [filePath];
    } else if (ext === '.js') {
      runnerCmd = 'node';
      runnerArgs = [filePath];
    } else if (ext === '.sh') {
      runnerCmd = 'bash';
      runnerArgs = [filePath];
    } else {
      socket.emit('runner.incomingData', `\x1b[31mError: No runner configured for ${ext} files.\x1b[0m\r\n`);
      return;
    }

    socket.emit('runner.incomingData', `\x1b[32m[Running] ${runnerCmd} ${filePath}\x1b[0m\r\n\r\n`);

    try {
      const isWin = os.platform() === 'win32';
      const shellCmd = isWin ? 'cmd.exe' : 'bash';
      const shellArgs = isWin 
        ? ['/c', runnerCmd, ...runnerArgs] 
        : ['-c', `${runnerCmd} "${runnerArgs.join('" "')}"`];

      const runnerPty = pty.spawn(shellCmd, shellArgs, {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: WORKSPACE_DIR,
        env: process.env
      });

      runnerPty.onData((data) => socket.emit('runner.incomingData', data));
      
      runnerPty.onExit((code) => {
        socket.emit('runner.incomingData', `\r\n\x1b[33m[Done] exited with code=${code.exitCode}\x1b[0m\r\n`);
        activeRunners.delete(socket.id);
      });

      activeRunners.set(socket.id, runnerPty);
    } catch (e) {
      socket.emit('runner.incomingData', `\x1b[31mFailed to start runner: ${e.message}\x1b[0m\r\n`);
    }
  });

  socket.on('runner.keystroke', (data) => {
    const runner = activeRunners.get(socket.id);
    if (runner) runner.write(data);
  });

  socket.on('runner.kill', () => {
    if (activeRunners.has(socket.id)) {
      activeRunners.get(socket.id).kill();
      activeRunners.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    ptyProcess.kill();
    if (activeRunners.has(socket.id)) {
      activeRunners.get(socket.id).kill();
      activeRunners.delete(socket.id);
    }
  });
});

function getFilesRecursive(dir, fileList = [], relativePath = '') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.posix.join(relativePath, file);

    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.next') {
      return;
    }

    const isDirectory = fs.statSync(fullPath).isDirectory();
    fileList.push({ path: '/' + relPath, isDirectory });

    if (isDirectory) {
      getFilesRecursive(fullPath, fileList, relPath);
    }
  });

  return fileList;
}

app.get('/api/files', (req, res) => {
  try {
    const files = getFilesRecursive(WORKSPACE_DIR);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/read', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Path required' });
    
    const absolutePath = path.join(WORKSPACE_DIR, filePath);
    if (!absolutePath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Forbidden' });
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found' });
    if (fs.statSync(absolutePath).isDirectory()) return res.status(400).json({ error: 'Cannot read directory as file' });

    const content = fs.readFileSync(absolutePath, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/write', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Path required' });

    const absolutePath = path.join(WORKSPACE_DIR, filePath);
    if (!absolutePath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Forbidden' });

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(absolutePath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/mkdir', (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'Path required' });

    const absolutePath = path.join(WORKSPACE_DIR, folderPath);
    if (!absolutePath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Forbidden' });

    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Directory already exists' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/files/delete', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Path required' });

    const absolutePath = path.join(WORKSPACE_DIR, filePath);
    if (!absolutePath.startsWith(WORKSPACE_DIR)) return res.status(403).json({ error: 'Forbidden' });

    if (fs.existsSync(absolutePath)) {
      if (fs.statSync(absolutePath).isDirectory()) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(absolutePath);
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------
// NEW ENDPOINTS FOR TOOLING PANELS
// -----------------------------------------------------------------
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 1. Search Files
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });
  
  try {
    const isWin = os.platform() === 'win32';
    const cmd = isWin 
      ? `findstr /S /I /M /C:"${query}" "${path.join(WORKSPACE_DIR, '*')}"`
      : `grep -rnli "${query}" "${WORKSPACE_DIR}"`;
      
    try {
      const { stdout } = await execAsync(cmd);
      const files = stdout.split('\n').filter(f => f.trim()).map(f => {
        let relPath = isWin ? f.trim().replace(WORKSPACE_DIR + '\\', '') : f.trim().replace(WORKSPACE_DIR + '/', '');
        relPath = relPath.replace(/\\/g, '/');
        return { file: relPath, lineContent: 'Match found in file' };
      });
      res.json({ results: files });
    } catch (e) {
      res.json({ results: [] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Git Status
app.get('/api/git/status', async (req, res) => {
  try {
    const { stdout } = await execAsync('git status -s', { cwd: WORKSPACE_DIR });
    const lines = stdout.split('\n').filter(l => l.trim());
    const modified = [];
    const untracked = [];
    lines.forEach(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3).trim();
      if (status.includes('??')) untracked.push(file);
      else modified.push(file);
    });
    res.json({ modified, untracked });
  } catch (e) {
    res.json({ error: 'Git not initialized or not found' });
  }
});

// 3. Git Commit
app.post('/api/git/commit', async (req, res) => {
  const { message } = req.body;
  try {
    await execAsync('git add .', { cwd: WORKSPACE_DIR });
    const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: WORKSPACE_DIR });
    res.json({ success: true, stdout });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/git/push', async (req, res) => {
  try {
    const { stdout } = await execAsync('git push -u origin HEAD', { cwd: WORKSPACE_DIR });
    res.json({ success: true, stdout });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/git/pull', async (req, res) => {
  try {
    const { stdout } = await execAsync('git pull', { cwd: WORKSPACE_DIR });
    res.json({ success: true, stdout });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/git/clear-cache', async (req, res) => {
  try {
    const { stdout } = await execAsync('git rm -r --cached .', { cwd: WORKSPACE_DIR });
    res.json({ success: true, stdout });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/git/undo-commit', async (req, res) => {
  try {
    // Undo the last commit, keeping changes in the working directory
    const { stdout } = await execAsync('git reset --soft HEAD~1', { cwd: WORKSPACE_DIR });
    res.json({ success: true, stdout });
  } catch (e) {
    // If there's no HEAD~1 (e.g. first commit), fallback to updating the branch root
    try {
      await execAsync('git update-ref -d HEAD', { cwd: WORKSPACE_DIR });
      res.json({ success: true, stdout: 'Undid first commit' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post('/api/git/config', async (req, res) => {
  const { name, email, pat, repoUrl } = req.body;
  try {
    if (name) await execAsync(`git config user.name "${name}"`, { cwd: WORKSPACE_DIR });
    if (email) await execAsync(`git config user.email "${email}"`, { cwd: WORKSPACE_DIR });
    if (pat && repoUrl) {
      const urlWithoutProtocol = repoUrl.replace(/^https?:\/\//, '');
      const newUrl = `https://${pat}@${urlWithoutProtocol}`;
      try {
        await execAsync(`git remote set-url origin "${newUrl}"`, { cwd: WORKSPACE_DIR });
      } catch (err) {
        if (err.message.includes('No such remote')) {
          await execAsync(`git remote add origin "${newUrl}"`, { cwd: WORKSPACE_DIR });
        } else {
          throw err;
        }
      }
    }
    
    // Save to a local file in the workspace
    const credsPath = path.join(WORKSPACE_DIR, '.git-credentials.json');
    fs.writeFileSync(credsPath, JSON.stringify({ name, email, pat, repoUrl }, null, 2));
    
    // Add to .gitignore if not present
    const gitignorePath = path.join(WORKSPACE_DIR, '.gitignore');
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    if (!gitignoreContent.includes('.git-credentials.json')) {
      fs.appendFileSync(gitignorePath, '\n.git-credentials.json\n');
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/git/credentials', (req, res) => {
  try {
    const credsPath = path.join(WORKSPACE_DIR, '.git-credentials.json');
    if (fs.existsSync(credsPath)) {
      const data = fs.readFileSync(credsPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json({});
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. System Developer Tools Check
app.get('/api/system/check', async (req, res) => {
  const tools = {
    git: null, node: null, npm: null, bun: null, pnpm: null, yarn: null, python: null, pip: null, docker: null
  };

  const checkCommand = async (cmd, versionFlag = '--version') => {
    try {
      const { stdout } = await execAsync(`${cmd} ${versionFlag}`);
      return { installed: true, version: stdout.trim() };
    } catch {
      return { installed: false, version: null };
    }
  };

  tools.git = await checkCommand('git');
  tools.node = await checkCommand('node');
  tools.npm = await checkCommand('npm');
  tools.bun = await checkCommand('bun');
  tools.pnpm = await checkCommand('pnpm');
  tools.yarn = await checkCommand('yarn');
  tools.python = await checkCommand('python');
  tools.pip = await checkCommand('pip');
  tools.docker = await checkCommand('docker', '-v');

  res.json(tools);
});

app.post('/api/system/install', async (req, res) => {
  const { tool } = req.body;
  const npmInstallable = ['bun', 'pnpm', 'yarn'];
  
  if (npmInstallable.includes(tool.toLowerCase())) {
    try {
      await execAsync(`npm install -g ${tool.toLowerCase()}`);
      res.json({ success: true, message: `Successfully installed ${tool} globally.` });
    } catch (e) {
      res.status(500).json({ error: `Failed to install ${tool}: ` + e.message });
    }
  } else {
    res.status(400).json({ error: `${tool} cannot be automatically installed via npm. Please install it manually from its official website.` });
  }
});

app.post('/api/npm/install-global', async (req, res) => {
  const { packageName } = req.body;
  if (!packageName || !/^[a-zA-Z0-9\-@/.]+$/.test(packageName)) {
    return res.status(400).json({ error: 'Invalid package name.' });
  }
  
  try {
    const { stdout, stderr } = await execAsync(`npm install -g ${packageName}`);
    res.json({ success: true, message: `Successfully installed ${packageName} globally.`, details: stdout });
  } catch (e) {
    res.status(500).json({ error: `Failed to install ${packageName}: ` + e.message });
  }
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(.*)$/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
