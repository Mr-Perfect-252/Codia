import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { Clipboard, Play, GripVertical } from 'lucide-react';
import 'xterm/css/xterm.css';
import { useModal } from '../contexts/ModalContext';

const BACKEND_URL = window.location.origin;

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const { showAlert } = useModal();
  const [clipboardContent, setClipboardContent] = useState('');
  const [terminalHeight, setTerminalHeight] = useState('30%');
  const [isResizing, setIsResizing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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
      setIsConnected(true);
      term.writeln('\x1b[32m\x1b[1mConnected to Remote Backend\x1b[0m\r\n');
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && socketRef.current && isConnected) {
        setClipboardContent(text);
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

  const handleExecute = () => {
    // Execute button sends Enter keystroke to execute command in terminal
    // Only works if socket is connected
    if (socketRef.current && isConnected) {
      socketRef.current.emit('terminal.keystroke', '\r');
      xtermRef.current?.focus();
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    const containerHeight = rect.height;

    // Minimum and maximum height constraints (between 20% and 80% of container)
    const minHeight = containerHeight * 0.2;
    const maxHeight = containerHeight * 0.8;

    if (newHeight >= minHeight && newHeight <= maxHeight) {
      setTerminalHeight(`${(newHeight / containerHeight) * 100}%`);
    }
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
    <div 
      ref={containerRef}
      style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remote Terminal</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handlePaste}
            disabled={!isConnected}
            title="Paste from Clipboard"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: isConnected ? 'var(--text-primary)' : '#666', 
              cursor: isConnected ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              opacity: isConnected ? 1 : 0.5
            }}
            onMouseEnter={(e) => isConnected && (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => isConnected && (e.target.style.background = 'none')}
          >
            <Clipboard size={14} /> Paste
          </button>
          <button 
            onClick={handleExecute}
            disabled={!isConnected}
            title="Execute Command (Press Enter)"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: isConnected ? 'var(--text-primary)' : '#666', 
              cursor: isConnected ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background 0.2s',
              opacity: isConnected ? 1 : 0.5
            }}
            onMouseEnter={(e) => isConnected && (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => isConnected && (e.target.style.background = 'none')}
          >
            <Play size={14} /> Execute
          </button>
        </div>
      </div>
      <div ref={terminalRef} style={{ flex: 1, overflow: 'auto', height: terminalHeight }} />
      
      {/* Resizable Divider */}
      <div 
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'var(--border-color)',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#58a6ff'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
      >
        <GripVertical size={12} color="rgba(255, 255, 255, 0.5)" />
      </div>
    </div>
  );
};

export default Terminal;
