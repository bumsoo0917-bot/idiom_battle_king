import React, { useState } from 'react';
import { ArrowLeft, Key, UserCheck } from 'lucide-react';
import Header from '../components/Header';
import { joinGame } from '../api/gameApi';

export default function StudentJoinPage({ onNavigate, onJoinSuccess }) {
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!gameCode.trim()) {
      return setError('참여 코드를 입력해주세요.');
    }
    if (!nickname.trim()) {
      return setError('닉네임을 입력해주세요.');
    }
    if (nickname.trim().length > 8) {
      return setError('닉네임은 최대 8자 이내로 입력해주세요.');
    }

    setLoading(true);
    try {
      const studentData = await joinGame(gameCode, nickname);
      onJoinSuccess(studentData);
      onNavigate('STUDENT_WAITING');
    } catch (err) {
      setError(err.message || '입장에 실패했습니다. 코드를 다시 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div 
          className="card animate-pop" 
          style={{ maxWidth: '450px', width: '100%', borderTop: '8px solid var(--color-primary)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <button 
              onClick={() => onNavigate('HOME')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>학생 참여하기</h2>
          </div>

          {error && (
            <div 
              style={{ 
                backgroundColor: 'rgba(231, 76, 60, 0.1)', 
                color: 'var(--color-red)', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: 'bold',
                borderLeft: '4px solid var(--color-red)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="gameCode">
                <Key size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                참여 코드 (6자리)
              </label>
              <input 
                type="text" 
                id="gameCode"
                className="form-input"
                placeholder="교사 화면의 코드를 입력하세요"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                disabled={loading}
                maxLength={6}
                required
                style={{ textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px', fontWeight: '800' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nickname">
                <UserCheck size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                닉네임 (최대 8자)
              </label>
              <input 
                type="text" 
                id="nickname"
                className="form-input"
                placeholder="친구들이 알아볼 수 있는 이름"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
                maxLength={8}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-large" 
              style={{ marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? '입장 중...' : '대기방 입장하기 🚀'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
