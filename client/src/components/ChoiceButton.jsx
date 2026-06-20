import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ChoiceButton({ 
  choiceNumber, 
  choiceText, 
  isSelected, 
  isCorrect, 
  isIncorrect, 
  disabled, 
  onClick 
}) {
  let buttonClass = 'choice-btn';
  if (isSelected) buttonClass += ' selected';
  if (isCorrect) buttonClass += ' correct';
  if (isIncorrect) buttonClass += ' incorrect';

  return (
    <button 
      className={buttonClass} 
      disabled={disabled} 
      onClick={onClick}
      style={{ width: '100%' }}
    >
      <div className="choice-number">{choiceNumber}</div>
      <div style={{ flex: 1, fontSize: '18px', textAlign: 'left', lineHeight: '1.4' }}>
        {choiceText}
      </div>
      
      {isCorrect && <CheckCircle2 size={24} color="var(--color-green)" fill="rgba(46, 204, 113, 0.1)" />}
      {isIncorrect && <XCircle size={24} color="var(--color-red)" fill="rgba(231, 76, 60, 0.1)" />}
    </button>
  );
}
