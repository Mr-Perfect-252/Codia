import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { X, Square } from 'lucide-react';
import 'xterm/css/xterm.css';

const BACKEND_URL = window.location.origin;

const RunnerDialog = ({ file, onClose }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const xtermRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    const term = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
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
    term.write('\x1b[36mConnecting to runner service...\x1b[0m\r\n');

    socket.on('connect', () => {
      term.write('\x1b[32mConnected.\x1b[0m\r\n');
      // Tell backend to start the script runner ONLY AFTER connected
      socket.emit('runner.start', file);
    });

    socket.on('connect_error', (err) => {
      term.write(`\r\n\x1b[31mConnection Error: ${err.message}\x1b[0m\r\n`);
    });

    term.onData((data) => {
      socket.emit('runner.keystroke', data);
    });

    socket.on('runner.incomingData', (data) => {
      term.write(data);
    });

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.emit('runner.kill'); // Kill process on close
      socket.disconnect();
      term.dispose();
    };
  }, [file]);

  const handleStop = () => {
    if (socketRef.current) {
      socketRef.current.emit('runner.kill');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        height: '60vh',
        backgroundColor: '#181818',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 15px',
          backgroundColor: '#252526',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cccccc' }}>
            Code Runner: {file}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleStop}
              title="Stop Runner"
              style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Square size={14} fill="#f44336" /> Stop
            </button>
            <button 
              onClick={onClose}
              title="Close Dialog"
              style={{ background: 'none', border: 'none', color: '#cccccc', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Terminal Container */}
        <div ref={terminalRef} style={{ flex: 1, padding: '10px', overflow: 'hidden', backgroundColor: '#1e1e1e' }} />
      </div>
    </div>
  );
};

export default RunnerDialog;
