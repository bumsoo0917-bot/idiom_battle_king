import React from 'react';
import { Hourglass } from 'lucide-react';

export default function TimerBar({ secondsLeft, timeLimit = 30 }) {
  const percentage = (secondsLeft / timeLimit) * 100;
  
  let fillClass = 'timer-fill';
  if (secondsLeft <= 5) {
    fillClass += ' danger';
  } else if (secondsLeft <= 15) {
    fillClass += ' warning';
  }

  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '15px' }}>
          <Hourglass size={18} className={secondsLeft <= 5 ? 'animate-bounce' : ''} color={secondsLeft <= 5 ? 'var(--color-red)' : 'var(--text-primary)'} />
          <span>남은 시간</span>
        </div>
        <span 
          style={{ 
            fontSize: '18px', 
            fontWeight: '900', 
            color: secondsLeft <= 5 ? 'var(--color-red)' : 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {secondsLeft}초
        </span>
      </div>
      <div className="timer-container">
        <div 
          className={fillClass} 
          style={{ width: `${percentage}%`, transition: 'width 1s linear' }}
        />
      </div>
    </div>
  );
}
