const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const app = express();
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

app.use(cors());
app.use(express.json());
app.use('/workspace', express.static(WORKSPACE_DIR));

async function ensureWorkspace() {
  try {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  } catch (e) {}
}
ensureWorkspace();

app.get('/api/files/list', async (req, res) => {
  try {
    const dir = req.query.dir || '';
    const fullPath = path.join(WORKSPACE_DIR, dir);
    const items = await fs.readdir(fullPath);
    const list = await Promise.all(items.map(async (name) => {
      const stat = await fs.stat(path.join(fullPath, name));
      return { name, isDir: stat.isDirectory(), path: path.join(dir, name) };
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/files/read', async (req, res) => {
  try {
    const filePath = path.join(WORKSPACE_DIR, req.query.path || '');
    const content = await fs.readFile(filePath, 'utf8');
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/files/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    await fs.writeFile(path.join(WORKSPACE_DIR, filePath), content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/npm/install-global', (req, res) => {
  const { packageName } = req.body;
  exec(`npm install -g ${packageName}`, (error, stdout, stderr) => {
    if (error) return res.json({ error: stderr || error.message });
    res.json({ message: `Installed ${packageName}` });
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const ptyProcess = pty.spawn(os.platform() === 'win32' ? 'powershell.exe' : 'bash', [], {
    cwd: WORKSPACE_DIR,
    env: process.env
  });

  ptyProcess.onData((data) => socket.emit('terminal.incomingData', data));
  socket.on('terminal.keystroke', (data) => ptyProcess.write(data));
  socket.on('disconnect', () => ptyProcess.kill());
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
