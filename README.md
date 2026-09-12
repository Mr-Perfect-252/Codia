# Codia

**A browser-based IDE that puts your host machine's full development environment behind a modern, glassmorphic interface.**

Codia is a hyper-optimized web IDE designed for developers who want real control over their local machine through the browser. It's not a toy editor — it's a bridge between the browser and an actual dev environment: real file system access, a real terminal, real Git, and real package management, all running through a single tab.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> 🔄 **This is the predecessor to [Codium](https://github.com/Mr-Perfect-252/Codium)** — a more advanced, sandboxed evolution of this same idea, built on Daytona sandboxes instead of a local host connection. If you're looking for the actively maintained, production-grade version, check out Codium. Codia remains open source as the original proof of concept and a lighter-weight, self-hosted alternative.

---

## What makes it different

Most "mobile code editor" apps are glorified text boxes. Codia isn't. It runs a real Node.js backend on your host machine and exposes it through a mobile-optimized frontend, so every action you take — creating a file, running a script, pushing to Git — actually happens on real hardware, not in a sandboxed toy environment.

## Features

### 🗂️ Full File System Explorer
A real file manager wired directly into your host machine's disk. Recursive tree rendering, rich file-type icons, and instant file/folder creation and deletion — backed by actual `fs` operations on the backend, not a mock filesystem.

### ✍️ Monaco Editor (the real VS Code editor)
The exact same editor that powers desktop VS Code. Automatic language detection based on file extension drives syntax highlighting, bracket matching, and autocomplete. The toolbar adapts contextually — a Run button for scripts, a Preview button for HTML, a Visualize button for Python.

### ▶️ Live Code Execution
Run Python, JavaScript, or shell scripts directly on your host machine from your phone. The backend spawns a real process via `child_process`, captures stdout/stderr, and streams the output back into a terminal-style modal.

### 🐍 Client-Side Python Visualization
Powered by Skulpt, Python code compiles and runs entirely client-side. Scripts using `turtle` graphics render live on an HTML canvas — no backend round-trip required.

### 💻 Remote Terminal (WebSockets + node-pty)
A genuine interactive terminal, not a simulated one. The backend spawns a real pseudo-terminal via `node-pty`, and keystrokes stream bidirectionally over WebSockets using `xterm.js` on the frontend.

### 🔀 Full Git Integration
An end-to-end Git GUI — no CLI required. Securely stores your GitHub PAT (written server-side, auto-added to `.gitignore`, never touching `localStorage`), and supports push, pull, cache clearing, and undoing commits, all with one tap.

### 🧰 System Developer Tools Dashboard
Live version checks for Git, Node, npm, Bun, pnpm, Yarn, Python, pip, and Docker — with one-tap installers for anything missing.

### 📦 Global NPM Registry Manager
Search the live npm registry and install packages globally to your host machine, right from the browser.

### 🌐 In-App Browser & Live HTML Preview
A sandboxed iframe browser for previewing your local dev server (defaults to `localhost:5173`), plus a zero-latency HTML preview mode that renders files directly via `srcDoc` — no server required.

### 🪟 Glassmorphic UI
Every native `alert()`/`confirm()` is replaced with a custom, context-driven modal system — translucent, animated, and dark-mode native.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Editor | Monaco Editor |
| Terminal | xterm.js + node-pty (backend) |
| Realtime | Socket.io / WebSockets |
| Client-side Python | Skulpt |
| Backend | Node.js, Express-style REST API |
| Icons | react-icons |

## Project Structure

- `src/` — React frontend (editor, explorer, terminal, Git panel, modal system)
- `backend/` — Node.js server handling filesystem access, process execution, Git operations, and the terminal WebSocket bridge
- `public/` — static assets
- `workspace/sample-project/` — a sample project you can open immediately to try the IDE without wiring up your own repo

## Getting Started

See [`DEV_SETUP.md`](./DEV_SETUP.md) for full local setup instructions. In short: install dependencies for both the frontend and `backend/`, start the backend so it can access your filesystem and shell, then run the Vite dev server and open it on any device on your network — including your phone.

## Why it exists

Codia was built to answer a simple question: what if your editor didn't need to be a native desktop app to have full access to your machine? It intentionally avoids sandboxing your work away from your real environment — the tradeoff is that Codia is meant to be run on hardware you trust and control, typically your own dev box or home server.

For a more isolated, cloud-sandboxed take on the same idea — with remote Daytona environments instead of direct host access — see **[Codium](https://github.com/Mr-Perfect-252/Codium)**, the actively developed successor to this project.

## Contributing

Codia is fully open source and welcomes contributions — bug fixes, new features, or general cleanup. Open an issue or a pull request.

## License

MIT — see [`LICENSE`](./LICENSE) for details.
