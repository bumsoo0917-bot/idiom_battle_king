import React from 'react';
import { HelpCircle, Star } from 'lucide-react';

export default function QuizCard({ questionNumber, totalQuestions, level, questionText, type }) {
  const getLevelBadge = (lvl) => {
    switch (lvl) {
      case 'EASY':
        return <span className="badge badge-easy">★ 쉬움 (+100)</span>;
      case 'NORMAL':
        return <span className="badge badge-normal">★★ 보통 (+150)</span>;
      case 'HARD':
        return <span className="badge badge-hard">★★★ 어려움 (+200)</span>;
      default:
        return <span className="badge badge-easy">쉬움</span>;
    }
  };

  const getTypeName = (t) => {
    switch (t) {
      case 'MEANING':
        return '뜻 맞히기 문제';
      case 'SITUATION':
        return '상황 맞히기 문제';
      case 'CONTEXT':
        return '문맥 속 관용어 고르기 문제';
      case 'OX':
        return 'OX 퀴즈';
      default:
        return '관용어 퀴즈';
    }
  };

  return (
    <div className="card animate-slide" style={{ borderTop: '8px solid var(--color-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontWeight: '800', color: 'var(--color-navy)', fontSize: '18px' }}>
          문제 {questionNumber} / {totalQuestions || 6}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '13px', backgroundColor: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
            {getTypeName(type)}
          </span>
          {getLevelBadge(level)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '12px' }}>
        <HelpCircle size={28} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.4', color: 'var(--text-primary)' }}>
          {questionText}
        </h2>
      </div>
    </div>
  );
}
