import React from 'react';

export default function TeamBadge({ name, color }) {
  if (!name) return null;

  return (
    <span 
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: color || 'var(--color-primary)', 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: '800',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></span>
      {name}
    </span>
  );
}
