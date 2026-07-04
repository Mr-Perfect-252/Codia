import React, { useEffect, useRef, useState } from 'react';
import { X, Square, Minus } from 'lucide-react';

const VisualizerDialog = ({ file, code, onClose }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [output, setOutput] = useState('');
  const outputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Dynamically load Skulpt scripts
    const loadSkulpt = async () => {
      if (window.Sk) {
        setIsLoaded(true);
        return;
      }
      
      const script1 = document.createElement('script');
      script1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js';
      script1.async = false;
      document.body.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js';
      script2.async = false;
      document.body.appendChild(script2);

      script2.onload = () => {
        setIsLoaded(true);
      };
    };

    loadSkulpt();
  }, []);

  const runSkulpt = () => {
    if (!window.Sk) return;
    
    setOutput('');
    
    const canvasContainer = document.getElementById('turtle-canvas');
    if (canvasContainer) {
      canvasContainer.innerHTML = '';
    }

    const outf = (text) => {
      setOutput((prev) => prev + text);
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    };

    const builtinRead = (x) => {
      if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles["files"][x] === undefined) {
        throw "File not found: '" + x + "'";
      }
      return window.Sk.builtinFiles["files"][x];
    };

    window.Sk.pre = "skulpt-output";
    window.Sk.configure({ output: outf, read: builtinRead }); 
    
    window.Sk.TurtleGraphics = window.Sk.TurtleGraphics || {};
    window.Sk.TurtleGraphics.target = 'turtle-canvas';
    
    // Set width and height explicitly to fit the window perfectly
    if (containerRef.current) {
      window.Sk.TurtleGraphics.width = containerRef.current.clientWidth;
      window.Sk.TurtleGraphics.height = containerRef.current.clientHeight;
    }
    
    const myPromise = window.Sk.misceval.asyncToPromise(() => {
      return window.Sk.importMainWithBody("<stdin>", false, code, true);
    });
    
    myPromise.then(() => {
      console.log('Skulpt done');
    }, (err) => {
      setOutput((prev) => prev + '\nError: ' + err.toString());
    });
  };

  useEffect(() => {
    if (isLoaded) {
      // Small delay to ensure the container is measured properly
      setTimeout(() => runSkulpt(), 100);
    }
  }, [isLoaded]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: '80%',
        maxWidth: '800px',
        height: '70vh',
        backgroundColor: '#000000',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        border: '1px solid #555'
      }}>
        {/* Windows-style White Title Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          color: '#000000',
          padding: '0 10px',
          height: '32px',
          userSelect: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Feather/Python Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3572A5' }}>
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
              <line x1="16" y1="8" x2="2" y2="22"></line>
              <line x1="17.5" y1="15" x2="9" y2="15"></line>
            </svg>
            <span style={{ fontSize: '12px', fontFamily: '"Segoe UI", sans-serif' }}>Python Turtle Graphics</span>
          </div>
          
          <div style={{ display: 'flex', height: '100%' }}>
            <button style={{ background: 'transparent', border: 'none', width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e5e5'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Minus size={14} />
            </button>
            <button style={{ background: 'transparent', border: 'none', width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e5e5'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <Square size={12} />
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', width: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#e81123'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Container (Black Background) */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
          
          {/* Turtle Canvas Area */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            {!isLoaded ? (
              <span style={{ color: '#fff', fontFamily: '"Segoe UI", sans-serif', fontSize: '14px' }}>Starting Python Engine...</span>
            ) : (
              <div id="turtle-canvas" style={{ width: '100%', height: '100%' }}></div>
            )}
          </div>

          {/* Hidden/Minimal Output for Errors */}
          {output && (
            <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff5555', padding: '10px', fontSize: '12px', fontFamily: 'Consolas, monospace', position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid #333' }}>
              <pre id="skulpt-output" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizerDialog;
