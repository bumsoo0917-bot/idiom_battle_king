import React from 'react';
import { Crown, BookOpen, User, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';

export default function HomePage({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div 
          className="card animate-pop" 
          style={{ 
            maxWidth: '520px', 
            width: '100%', 
            textAlign: 'center', 
            padding: '48px 32px',
            border: '4px solid #fff',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--border-radius-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div 
              style={{ 
                background: 'linear-gradient(135deg, #f1c40f, #f39c12)', 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(241, 196, 15, 0.3)'
              }}
            >
              <Crown size={48} color="white" fill="white" className="animate-bounce" />
            </div>
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: '900', color: 'var(--color-navy)', marginBottom: '8px' }}>
            관용어 대결왕
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '36px', fontWeight: '500' }}>
            초등학교 6학년 필수 관용어 표현 대결 퀴즈쇼!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <button 
              onClick={() => onNavigate('STUDENT_JOIN')} 
              className="btn btn-primary btn-large"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
            >
              <User size={24} />
              학생으로 입장하기
            </button>
            
            <button 
              onClick={() => onNavigate('TEACHER_DASHBOARD')} 
              className="btn btn-purple btn-large"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
            >
              <BookOpen size={24} />
              선생님용 대시보드
            </button>

            <button 
              onClick={() => onNavigate('QUESTION_MANAGE')} 
              className="btn btn-secondary"
              style={{ fontSize: '15px', padding: '12px 24px', alignSelf: 'center' }}
            >
              <ShieldAlert size={16} />
              문제 은행 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
