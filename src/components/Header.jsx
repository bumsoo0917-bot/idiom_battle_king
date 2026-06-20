import React from 'react';
import { Crown, Home, LogOut } from 'lucide-react';

export default function Header({ gameCode, nickname, teamName, teamColor, onExit }) {
  return (
    <header className="quiz-header">
      <div className="logo">
        <Crown size={28} className="animate-bounce" color="#f1c40f" fill="#f1c40f" />
        <span>관용어 대결왕 👑</span>
      </div>
      
      {gameCode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>참여 코드: </span>
            <strong style={{ fontSize: '18px', color: 'var(--color-navy)', letterSpacing: '1px' }}>{gameCode}</strong>
            
            {nickname && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{nickname}</span>
                {teamName && (
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      backgroundColor: teamColor || '#ccc', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px',
                      fontWeight: '800'
                    }}
                  >
                    {teamName.split(' ')[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {onExit && (
            <button 
              onClick={onExit} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="나가기"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
