// ============================================================================
// Quick Calculator Modal
// Quick accessible modal from the top navigation bar across all modules
// ============================================================================

import React from 'react';
import { X } from 'lucide-react';
import { CalculatorPage } from '@/features/calculator/CalculatorPage';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 60 }}>
      <div
        className="card"
        style={{
          width: '95%',
          maxWidth: '960px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          className="btn btn-icon btn-outline"
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
        >
          <X size={18} />
        </button>

        <div style={{ marginTop: '0.5rem' }}>
          <CalculatorPage />
        </div>
      </div>
    </div>
  );
};
