# Android VS (Mobile VS Code) - Comprehensive Features Guide

Welcome to **Android VS**, a hyper-optimized, glassmorphic, mobile-first Integrated Development Environment (IDE) that runs straight from your browser. Designed to give developers absolute control over their local host machine while they are on the go, this application merges the aesthetics of a sleek modern UI with the raw power of a desktop development environment. 

Below is an extensive, in-depth guide detailing every single feature engineered into this platform, how it works under the hood, and how you can leverage it to maximize your productivity.

---

## 1. The Core Layout Engine & Activity Bar

At the heart of the application is the **Activity Bar**, a familiar concept borrowed from VS Code, situated on the far left of the screen. This vertical strip acts as the central nervous system for navigating the IDE.

### How it Works:
- **Dynamic Routing**: The Activity Bar uses a React state management system (`activeTab`) to seamlessly switch between different panels (Explorer, Search, Git, NPM, Browser, Preview, Packages).
- **Smart Layout Adaptation**: The layout engine is context-aware. If you are browsing files or managing Git, the app uses a split-pane layout (Sidebar + Main Editor). However, if you launch the In-App Browser or Live HTML Preview, the engine intelligently collapses the sidebar to grant the previewer 100% of the screen width, ensuring your workspace is never crammed.

---

## 2. Advanced File System Explorer

The **Explorer** tab (📄) is a fully functional file manager that interfaces directly with your host machine's hard drive.

### Features:
- **Tree-View Rendering**: Files and folders are parsed recursively and rendered in a hierarchical tree.
- **Rich Iconography**: Utilizing a massive mapping of `react-icons`, the explorer visually distinguishes between file types. React files get the blue atom, Python gets the yellow/blue snakes, Vite configs get the purple lightning bolt, etc.
- **Instant Creation/Deletion**: You can create new files or directories with a single tap. Under the hood, this sends a REST API call to the Node.js backend, which uses native `fs` module operations to manipulate the host PC's storage. 
- **Safety First**: Deletions trigger the custom glassmorphic modal system to ask for confirmation, preventing accidental data loss.

---

## 3. Monaco Code Editor Integration

The main workspace houses Microsoft's **Monaco Editor**—the exact same code editor that powers the desktop version of VS Code.

### Features:
- **Language Auto-Detection**: When you select a file in the explorer, the frontend parses the file extension (`.js`, `.py`, `.html`, etc.) and automatically switches the Monaco instance's language mode, enabling tailored syntax highlighting, bracket matching, and auto-completion.
- **Smart Top-Bar Actions**: The editor's header isn't static. It actively listens to what file is open. If you open a Python file, a blue "Visualize" button and a green "Run" button dynamically mount. If you open an HTML file, an orange "Preview" button appears. If no file is open, it gracefully displays a "Manage Credentials" button.

---

## 4. Live Server Code Execution (Runner)

You are not limited to just writing code; you can execute it directly on your host machine from your phone.

### How it Works:
When you tap the **Run (▶️)** button on a supported script (Python, JavaScript, Shell), the frontend opens the Runner Dialog. 
- It issues a POST request to `/api/run` on the backend, passing the absolute path of the file.
- The Node.js server uses the `child_process.exec` module to spawn a process (e.g., `node script.js` or `python script.py`).
- The standard output (stdout) and standard error (stderr) streams are captured and sent back to the frontend, where they are rendered in a simulated dark-mode terminal window inside the modal.

---

## 5. Client-Side Python Visualization

For data science or algorithmic tasks, running code on the backend isn't always enough—sometimes you want to visualize it natively in the browser.

### Features:
- **Skulpt Integration**: By utilizing the Skulpt library, Python code is compiled and executed entirely on the client-side (inside the browser) using JavaScript.
- **Turtle Graphics & DOM Manipulation**: The Visualizer Dialog provides a dedicated HTML canvas. If your Python script imports `turtle`, it will actually draw the graphics in real-time right on your phone screen, without ever needing to communicate with the Node server.

---

## 6. Remote Terminal via WebSockets

Located at the bottom of the main layout is a fully interactive, real-time terminal.

### How it Works:
- **xterm.js**: The frontend uses `xterm.js` to render a highly performant terminal emulator canvas.
- **Socket.io & node-pty**: The backend utilizes `node-pty` to spawn a pseudo-terminal (like PowerShell on Windows or Bash on Linux).
- **Bidirectional Streaming**: Keystrokes on your mobile device are transmitted via WebSockets to the host PC, executed in the active shell process, and the output is instantly streamed back to the xterm canvas.
- **Clipboard API**: A custom "Paste" button interfaces with the browser's `navigator.clipboard` API to allow you to easily paste long commands into the terminal.

---

## 7. Complete Git Source Control

The **Source Control** tab (🔀) provides an end-to-end GUI for Git, allowing you to sync with GitHub without touching the CLI.

### Features:
- **Credential Management**: A secure credentials dialog allows you to input your GitHub Personal Access Token (PAT), Name, Email, and Repository URL.
- **Local Secure Storage**: Instead of using vulnerable browser `localStorage`, the backend writes your credentials to a `.git-credentials.json` file in the project root. It also automatically appends this file to your `.gitignore` to guarantee your secrets are never accidentally pushed to a public repository.
- **Push & Pull**: With one tap, the backend executes `git push -u origin HEAD` or `git pull`, automatically structuring the remote URL with your PAT to bypass interactive terminal password prompts.
- **Cache Clearing & Undoing**: Made a mistake? The UI features dedicated buttons to run `git rm -r --cached .` (to untrack accidentally committed secrets) and `git reset HEAD~1` (to undo the last commit).

---

## 8. System Developer Tools Dashboard

The **System Tools** tab (📦) acts as a health monitor for your host PC's environment.

### Features:
- **Global Dependency Checking**: On mount, the frontend pings the backend to run version checks (`--version`) for Git, Node.js, npm, Bun, pnpm, Yarn, Python, pip, and Docker.
- **Smart Installers**: If a JavaScript-based package manager (like Bun, pnpm, or Yarn) is missing, an "Install" button appears. Tapping it triggers the backend to run `npm install -g <tool>` under the hood. The UI displays an elegant loading spinner, tracks the asynchronous installation, and refreshes the panel automatically upon success.

---

## 9. Global NPM Registry Manager

Located under the **npm** tab, this feature turns your mobile IDE into a full-fledged package manager.

### How it Works:
- **Live Search**: When you type a query, the frontend makes a direct HTTP fetch to the official NPM registry (`https://registry.npmjs.org/-/v1/search`), returning real-time data on packages, versions, and descriptions.
- **1-Click Global Installation**: Every search result has an "Install Global" button. Selecting it tells the backend to run `npm install -g <package_name>`. This allows you to install CLIs, tools, and frameworks to your PC while miles away from your keyboard.

---

## 10. In-App Web Browser

The **In-App Browser** tab (🌐) completely eliminates the need to switch between Chrome tabs while developing web applications.

### Features:
- **Full-Screen Canvas**: As mentioned in the layout section, selecting this tab hides the explorer sidebar to maximize viewing space.
- **Iframe Sandboxing**: It uses a secure `iframe` with appropriate sandbox permissions to render websites.
- **Localhost Previewing**: By default, it points to `http://localhost:5173` (the Vite default), allowing you to see your React/Vue applications hot-reload side-by-side with your backend operations.
- **Navigation Controls**: Features a URL input bar, a Home button (resets to default), and a Refresh button that forces the iframe to reload its source.

---

## 11. Full-Screen Live HTML Preview

If you are writing vanilla HTML/CSS, booting up a localhost server can be tedious. The **Live Preview** tab (👁️) solves this.

### How it Works:
- **Context-Aware Trigger**: When you open an `.html` file, a "Preview" button appears in the editor.
- **Memory Injection**: Tapping the button switches the layout to full-screen and reads the raw text of the HTML file directly from the disk.
- **srcDoc Rendering**: Instead of serving the file over a network port, the raw HTML string is injected directly into an iframe's `srcDoc` attribute. This results in zero-latency rendering of your web pages. A refresh button allows you to instantly pull the latest saved changes from the disk.

---

## 12. Glassmorphic Modal System

To ensure a premium, modern aesthetic, all native JavaScript popups (`alert()` and `confirm()`) have been eradicated and replaced with a proprietary context-based modal engine.

### Features:
- **React Context API**: The `<ModalProvider>` wraps the entire application tree, exposing `showAlert` and `showConfirm` hooks to any nested component.
- **Rich Aesthetics**: The modals feature translucent glassmorphism (`backdrop-filter: blur`), dark-mode styling, and smooth CSS keyframe animations (fading in and sliding up).
- **Dynamic Content**: Modals adapt their icons and colors based on the context—displaying a green checkmark for success (like a completed Git Push), a red warning triangle for errors, or a blue info circle for neutral messages.

---

## Summary

**Android VS** is more than just a text editor; it is a bridging technology. By combining WebSocket terminal access, REST APIs for file and system manipulation, and a highly responsive React frontend, it completely breaks down the barrier between a mobile device and a heavy desktop workstation. Whether you need to fix a quick bug in production, visualize a Python algorithm, manage a GitHub repository, or install global NPM packages, you can now do it all from the palm of your hand.
