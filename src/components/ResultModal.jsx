import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ResultModal({ isOpen, title, message, showLoading = false, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: 'var(--color-navy)' }}>
          {title}
        </h3>
        
        {message && (
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            {message}
          </p>
        )}

        {showLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <Loader2 size={36} color="var(--color-primary)" className="animate-bounce" style={{ animation: 'spin 1.5s linear infinite' }} />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
