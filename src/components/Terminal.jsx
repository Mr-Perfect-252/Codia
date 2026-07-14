import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    const term = new XTerm({
      theme: { background: '#000', foreground: '#fff' },
      fontSize: 14,
      cursorBlink: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.onData((data) => socket.emit('terminal.keystroke', data));
    socket.on('terminal.incomingData', (data) => term.write(data));

    const resizeHandler = () => fitAddon.fit();
    window.addEventListener('resize', resizeHandler);
    window.visualViewport?.addEventListener('resize', resizeHandler);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      socket.disconnect();
      term.dispose();
      window.removeEventListener('resize', resizeHandler);
      window.visualViewport?.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
};

export default Terminal;
