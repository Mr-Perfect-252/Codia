import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { Clipboard, Play, GripVertical } from 'lucide-react';
import 'xterm/css/xterm.css';
import { useModal } from '../contexts/ModalContext';

const BACKEND_URL = window.location.origin;

const Terminal = ({ fullMode = false }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const { showAlert } = useModal();
  const [isConnected, setIsConnected] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState('30%');
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    const term = new XTerm({
      theme: {
        background: '#000000',
        foreground: '#c9d1d9',
        cursor: '#58a6ff'
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 20000,     // Huge scroll history
      rows: 60,              // More visible lines initially
      allowTransparency: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    socket.emit('terminal.resize', { cols: term.cols, rows: term.rows });

    term.onData((data) => socket.emit('terminal.keystroke', data));

    socket.on('terminal.incomingData', (data) => {
      term.write(data);
    });

    socket.on('connect', () => {
      setIsConnected(true);
      term.writeln('\x1b[32m\x1b[1mConnected to Remote Backend\x1b[0m\r\n');
      // Add blank lines for extra scroll space
      term.writeln('\n'.repeat(20));
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      term.writeln('\r\n\x1b[31m\x1b[1mDisconnected from Remote Backend\x1b[0m\r\n');
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
      socket.emit('terminal.resize', { cols: term.cols, rows: term.rows });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, []);

  // Paste, Execute, Resize handlers (keep your existing ones here)
  const handlePaste = async () => { /* your code */ };
  const handleExecute = () => { /* your code */ };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current || fullMode) return;
    // ... your existing mouse move logic for height ...
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header & resizer unchanged */}
      {/* ... */}

      <div ref={terminalRef} style={{ flex: 1, overflow: 'auto' }} />
      
      {/* Resizer only in normal mode */}
    </div>
  );
};

export default Terminal;
