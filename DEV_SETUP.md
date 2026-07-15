# Codia - Mobile VS Code

A mobile-first web-based IDE with VS Code-like experience.

## Quick Start

Run both frontend (Vite) and backend (Express) servers:

```bash
npm run dev:all
```

Or separately:
```bash
# Terminal 1 - Backend
npm run start
# Terminal 2 - Frontend  
npm run dev
```

Then open: http://localhost:5173

### Default Auth Code
Use: I-AM-SOHAN-252

## Features

- File Explorer - Browse, create, delete files and folders
- Monaco Editor - VS Code editor with syntax highlighting
- Terminal - Full WebSocket terminal (bash/shell)
- Code Runner - Run Python, JavaScript, Shell scripts
- Git Integration - Commit, push, pull with GitHub PAT
- NPM Manager - Search and install global npm packages
- In-App Browser - Preview localhost servers
- HTML Preview - Live preview with CSS/JS dependency resolution
- System Tools - Check installed dev tools

## Troubleshooting

Terminal not working? Make sure the backend is running: npm run start

HTML Preview not loading CSS/JS? Files must be in the workspace directory

Git push/pull not working? Configure credentials via the Credentials button

## Development

```bash
npm install
cd backend && npm install
npm run build
```
