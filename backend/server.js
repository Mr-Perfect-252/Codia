const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

// ====================== SEPARATE WORKSPACE ======================
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  console.log('✅ Separate workspace created at:', WORKSPACE_DIR);
}
// ============================================================

// Load Git credentials from credentials.txt
let GIT_CREDENTIALS = { name: '', email: '', pat: '', repoUrl: '' };
const credsPath = path.join(process.cwd(), 'credentials.txt');
if (fs.existsSync(credsPath)) {
  try {
    const content = fs.readFileSync(credsPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const [key, ...value] = line.split('=');
        if (key && value.length) GIT_CREDENTIALS[key.trim()] = value.join('=').trim();
      }
    });
    console.log('✅ Loaded Git credentials from credentials.txt');
  } catch (e) {
    console.log('⚠️ Could not load credentials.txt');
  }
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Terminal
io.on('connection', (socket) => {
  const ptyProcess = pty.spawn(os.platform() === 'win32' ? 'powershell.exe' : 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: WORKSPACE_DIR,
    env: process.env
  });

  ptyProcess.onData((data) => {
    socket.emit('terminal.incomingData', data);

    // Auto-detect dev server URLs (npm run dev, vite, etc.)
    const urlMatch = data.match(/https?:\/\/localhost:\d+/);
    if (urlMatch) {
      const url = urlMatch[0];
      console.log(`\n🔗 Dev Server URL detected: ${url}`);
      console.log(`Open this in your browser → ${url}\n`);
    }
  });

  socket.on('terminal.keystroke', (data) => ptyProcess.write(data));
  socket.on('terminal.resize', (size) => {
    try { ptyProcess.resize(size.cols, size.rows); } catch (e) {}
  });

  socket.on('disconnect', () => ptyProcess.kill());
});

// Git credentials endpoint
app.get('/api/git/credentials', (req, res) => res.json(GIT_CREDENTIALS));

// Add your other endpoints (file system, git commit, push, etc.) here...

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`Workspace folder: ${WORKSPACE_DIR}`);
});
