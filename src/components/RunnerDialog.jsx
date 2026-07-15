import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import { X, Square } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const RunnerDialog = ({ file, onClose }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const xtermRef = useRef(null);
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#58a6ff'
      },
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();
    term.write('\x1b[36m[Codia Runner]\x1b[0m Connecting to runner service...\r\n');

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      term.write('\x1b[32mConnected.\x1b[0m\r\n');
      term.write(`\x1b[33mExecuting:\x1b[0m ${file}\r\n\r\n`);
      // Tell backend to start the script runner ONLY AFTER connected
      // Send as object with file property
      socket.emit('runner.start', { file });
    });

    socket.on('connect_error', (err) => {
      term.write(`\r\n\x1b[31m[Error]\x1b[0m Cannot connect to backend: ${err.message}\r\n`);
      term.write('\x1b[33mMake sure the backend server is running.\x1b[0m\r\n');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      term.write('\r\n\x1b[33m[Disconnected]\x1b[0m Connection lost\r\n');
    });

    term.onData((data) => {
      if (connected) {
        socket.emit('runner.keystroke', data);
      }
    });

    socket.on('runner.incomingData', (data) => {
      term.write(data);
    });

    socket.on('runner.exit', (code) => {
      term.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
    });

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (socketRef.current) {
        socketRef.current.emit('runner.kill'); // Kill process on close
        socketRef.current.disconnect();
      }
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
        maxWidth: '900px',
        height: '70vh',
        backgroundColor: '#181818',
        borderRadius: '8px',
        border: '1px solid #333',
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
          borderBottom: '1px solid #333'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cccccc' }}>
            <span style={{ 
              display: 'inline-block',
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: connected ? '#4caf50' : '#f44336',
              marginRight: '8px'
            }} />
            Runner: {file}
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
