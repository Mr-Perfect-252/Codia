import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { Clipboard } from 'lucide-react';
import 'xterm/css/xterm.css';
import { useModal } from '../contexts/ModalContext';

const BACKEND_URL = 'http://localhost:3000';

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const { showAlert } = useModal();

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
      cursorBlink: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    socket.emit('terminal.resize', { cols: term.cols, rows: term.rows });

    term.onData((data) => {
      socket.emit('terminal.keystroke', data);
    });

    socket.on('terminal.incomingData', (data) => {
      term.write(data);
    });

    socket.on('connect', () => {
      term.writeln('\x1b[32m\x1b[1mConnected to Remote Backend\x1b[0m\r\n');
    });

    socket.on('disconnect', () => {
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && socketRef.current) {
        // Send the pasted text directly to the backend
        socketRef.current.emit('terminal.keystroke', text);
        // Also explicitly focus the terminal so the user can continue typing
        xtermRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      showAlert('Paste failed. Please ensure clipboard permissions are granted.', { title: 'Clipboard Error', icon: 'warning' });
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remote Terminal</span>
        <button 
          onClick={handlePaste}
          title="Paste from Clipboard"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-primary)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          <Clipboard size={14} /> Paste
        </button>
      </div>
      <div ref={terminalRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
};

export default Terminal;
