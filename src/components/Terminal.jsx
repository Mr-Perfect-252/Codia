import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const Terminal = ({ fullMode = false }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#cccccc',
        cursorAccent: '#0c0c0c',
        black: '#0c0c0c',
        red: '#f44747',
        green: '#89d185',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#9cdcfe',
        white: '#d4d4d4',
        brightBlack: '#767676',
        brightRed: '#f44747',
        brightGreen: '#89d185',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#9cdcfe',
        brightWhite: '#ffffff',
        selectionBackground: '#264f78',
      },
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
      fontSize: fullMode ? 15 : 13,
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: false,
      scrollback: 10000,
      fastScrollModifier: 'alt',
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    
    // Initial fit
    setTimeout(() => fitAddon.fit(), 50);

    // Connect to backend
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      term.write('\x1b[32m[Codia Terminal]\x1b[0m Connected to backend\r\n\r\n');
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError(`Connection error: ${err.message}`);
      term.write(`\x1b[31m[Error]\x1b[0m Cannot connect to backend at ${BACKEND_URL}\r\n`);
      term.write('\x1b[33mMake sure the backend server is running (npm start in backend/)\x1b[0m\r\n\r\n');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      term.write('\r\n\x1b[33m[Disconnected]\x1b[0m Connection lost\r\n');
    });

    // Handle incoming data from PTY
    socket.on('terminal.incomingData', (data) => {
      term.write(data);
    });

    // Handle PTY exit
    socket.on('terminal.exit', (code) => {
      term.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
    });

    // Send keystrokes to backend
    term.onData((data) => {
      if (connected && socket) {
        socket.emit('terminal.keystroke', data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (connected && socket) {
        socket.emit('terminal.resize', { 
          cols: term.cols, 
          rows: term.rows 
        });
      }
    };

    // Fit on any resize
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial resize after a short delay
    setTimeout(handleResize, 100);

    return () => {
      resizeObserver.disconnect();
      socket.disconnect();
      term.dispose();
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [fullMode]);

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#0c0c0c',
      position: 'relative'
    }}>
      {/* Status bar */}
      <div style={{
        padding: '4px 12px',
        background: '#1e1e1e',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#858585'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: connected ? '#4caf50' : '#f44336'
          }} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        <span>Codia Terminal</span>
      </div>
      
      {/* Error message */}
      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#f44336',
          color: '#fff',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
      
      {/* Terminal container */}
      <div 
        ref={terminalRef} 
        style={{ 
          flex: 1, 
          padding: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default Terminal;
