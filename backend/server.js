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
const open = require('open'); // npm install open

const app = express();
app.use(cors());
app.use(express.json());

const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

// Create workspace folder
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  console.log('✅ Separate workspace created');
}

// Load Git credentials from credentials.txt
let GIT_CREDENTIALS = { name: '', email: '', pat: '', repoUrl: '' };
const credsPath = path.join(process.cwd(), 'credentials.txt');
if (fs.existsSync(credsPath)) {
  try {
    const content = fs.readFileSync(credsPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value) GIT_CREDENTIALS[key.trim()] = value.join('=').trim();
    });
    console.log('✅ Loaded credentials from credentials.txt');
  } catch (e) {}
}

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

    // Auto-open localhost URLs from npm run dev etc.
    const urlMatch = data.match(/https?:\/\/localhost:\d+/);
    if (urlMatch) {
      open(urlMatch[0]).catch(() => {});
    }
  });

  socket.on('terminal.keystroke', (data) => ptyProcess.write(data));
  socket.on('terminal.resize', (size) => {
    try { ptyProcess.resize(size.cols, size.rows); } catch (e) {}
  });

  socket.on('disconnect', () => ptyProcess.kill());
});

// File endpoints (use WORKSPACE_DIR) - keep your existing ones or I can expand if needed

// Git credentials from file
app.get('/api/git/credentials', (req, res) => res.json(GIT_CREDENTIALS));

app.post('/api/git/config', async (req, res) => {
  // Apply from credentials.txt
  try {
    if (GIT_CREDENTIALS.name) await execAsync(`git config user.name "${GIT_CREDENTIALS.name}"`, { cwd: WORKSPACE_DIR });
    if (GIT_CREDENTIALS.email) await execAsync(`git config user.email "${GIT_CREDENTIALS.email}"`, { cwd: WORKSPACE_DIR });
    // ... rest of git config with PAT
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Other git endpoints (status, commit, push, etc.) remain the same as before

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
