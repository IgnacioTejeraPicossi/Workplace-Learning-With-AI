import React from 'react';
import Modal from 'react-modal';
import { useTheme } from './ThemeContext';

Modal.setAppElement('#root');

const ModalDialog = ({ isOpen, onRequestClose, title, children }) => {
  const { colors } = useTheme();
  
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(34, 54, 168, 0.15)',
      zIndex: 1000,
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '16px',
      padding: '32px 24px 24px 24px',
      boxShadow: colors.shadow,
      border: `1px solid ${colors.border}`,
      maxWidth: '480px',
      width: '90%',
      background: colors.cardBackground,
      color: colors.text,
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel={title || 'Dialog'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: colors.primary }}>{title}</h2>
        <button
          onClick={onRequestClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: colors.primary,
            cursor: 'pointer',
            fontWeight: 700,
            lineHeight: 1,
          }}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      <div style={{ color: colors.text }}>{children}</div>
    </Modal>
  );
};

export default ModalDialog; 