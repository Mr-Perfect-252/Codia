import React, { createContext, useContext, useState, useCallback } from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ModalContext = createContext(null);

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    message: '',
    title: '',
    icon: 'info',
    resolvePromise: null
  });

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'alert',
        message,
        title: options.title || 'Notification',
        icon: options.icon || 'info',
        resolvePromise: resolve
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'confirm',
        message,
        title: options.title || 'Please Confirm',
        icon: options.icon || 'warning',
        resolvePromise: resolve
      });
    });
  }, []);

  const handleClose = (result) => {
    setModalState(prev => {
      if (prev.resolvePromise) prev.resolvePromise(result);
      return { ...prev, isOpen: false };
    });
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={24} color="#4caf50" />;
      case 'error': return <XCircle size={24} color="#f44336" />;
      case 'warning': return <AlertTriangle size={24} color="#ff9800" />;
      case 'info':
      default: return <Info size={24} color="#2196f3" />;
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {modalState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #1e1e1e, #121212)',
            border: '1px solid #333',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            width: '90%',
            maxWidth: '400px',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              gap: '12px'
            }}>
              {getIcon(modalState.icon)}
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600', letterSpacing: '0.02em' }}>
                {modalState.title}
              </h3>
            </div>
            
            {/* Body */}
            <div style={{ padding: '24px 20px', color: '#ccc', fontSize: '14px', lineHeight: '1.5' }}>
              {modalState.message}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.2)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              {modalState.type === 'confirm' && (
                <button 
                  onClick={() => handleClose(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: 'transparent',
                    color: '#ccc',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.target.style.background = '#333'; e.target.style.color = '#fff'; }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#ccc'; }}
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => handleClose(true)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0e639c, #1177bb)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(14, 99, 156, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.target.style.filter = 'brightness(1.1)'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.target.style.filter = 'brightness(1)'; e.target.style.transform = 'translateY(0)'; }}
              >
                {modalState.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ModalContext.Provider>
  );
};
