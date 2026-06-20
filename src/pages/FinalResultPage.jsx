import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Star, Users, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import Header from '../components/Header';
import { getGameResult } from '../api/gameApi';

export default function FinalResultPage({ gameId, onRestart }) {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      if (!gameId) return;
      try {
        const res = await getGameResult(gameId);
        setResultData(res);
      } catch (err) {
        setError('최종 결과를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [gameId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontWeight: 'bold' }}>최종 결과를 집계하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--color-red)', fontWeight: 'bold' }}>{error || '결과를 로드할 수 없습니다.'}</p>
          <button className="btn btn-primary" onClick={onRestart} style={{ marginTop: '16px' }}>홈으로 이동</button>
        </div>
      </div>
    );
  }

  const { winner_team, teams, students, difficult_questions, question_analytics, average_score } = resultData;

  // Sorting out idioms with lowest correct rates for "많이 틀린 관용어"
  const sortedAnalytics = [...question_analytics].sort((a, b) => a.correct_rate - b.correct_rate);
  const highlyIncorrect = sortedAnalytics.filter(q => q.correct_rate < 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="container" style={{ maxWidth: '750px' }}>
        
        {/* --- Winner team card --- */}
        <div 
          className="card animate-pop" 
          style={{ 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)', 
            color: 'white',
            border: '4px solid #f1c40f',
            borderRadius: 'var(--border-radius-lg)',
            padding: '48px 32px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div 
              style={{ 
                background: '#f1c40f', 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(241, 196, 15, 0.4)'
              }}
            >
              <Trophy size={48} color="#1e1b4b" fill="#1e1b4b" className="animate-bounce" />
            </div>
          </div>

          <span 
            style={{ 
              fontSize: '14px', 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            관용어 대결왕 우승팀 🏆
          </span>

          <h2 style={{ fontSize: '38px', fontWeight: '950', marginTop: '16px', color: '#f1c40f', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {winner_team ? winner_team.team_name : '참여 팀 없음'}
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', fontWeight: 'bold' }}>
            최종 점수: {winner_team ? winner_team.score : 0}점
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            <div>
              <span>참여 학생 수: </span>
              <strong style={{ color: 'white', fontSize: '16px' }}>{students.length}명</strong>
            </div>
            <div>
              <span>학생 평균 점수: </span>
              <strong style={{ color: 'white', fontSize: '16px' }}>{Math.round(average_score)}점</strong>
            </div>
          </div>
        </div>

        {/* --- Team Standing List --- */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--color-purple)" /> 팀 대결 결과
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teams.map((t, idx) => (
              <div 
                key={t.team_id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 20px', 
                  border: '2px solid #edf2f7', 
                  borderRadius: '12px',
                  background: idx === 0 ? 'rgba(241, 196, 15, 0.05)' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: idx === 0 ? '#f1c40f' : 'var(--text-secondary)' }}>
                    {idx + 1}위
                  </span>
                  <span 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: t.team_color 
                    }}
                  />
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>{t.team_name}</span>
                </div>
                <strong style={{ fontSize: '18px', color: 'var(--color-navy)' }}>{t.score}점</strong>
              </div>
            ))}
          </div>
        </div>

        {/* --- Student Ranking List --- */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--color-primary)" /> 개인별 정답 및 랭킹 (Top 10)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {students.slice(0, 10).map((s, idx) => (
              <div 
                key={s.student_id}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: '#fcfcfc', 
                  border: '1px solid #edf2f7',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: idx === 0 ? '#f1c40f' : idx === 1 ? '#cbd5e0' : 'var(--text-secondary)' }}>{idx + 1}등</span>
                  <span style={{ fontWeight: '700' }}>{s.nickname}</span>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      backgroundColor: s.team_color, 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontWeight: '800' 
                    }}
                  >
                    {s.team_name.split(' ')[0]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>맞힌 개수: <strong>{s.correct_count}개</strong></span>
                  <strong style={{ color: 'var(--color-indigo)' }}>{s.score}점</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Highly Incorrect Idioms --- */}
        {highlyIncorrect.length > 0 && (
          <div className="card" style={{ borderLeft: '6px solid var(--color-red)', background: 'rgba(231, 76, 60, 0.01)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> 많이 틀린 관용어 (정답률 60% 미만)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {highlyIncorrect.map(q => (
                <div 
                  key={q.question_id}
                  style={{ 
                    padding: '14px', 
                    borderRadius: '8px', 
                    background: 'white', 
                    border: '1px solid rgba(231, 76, 60, 0.15)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--color-navy)' }}>“{q.idiom}”</strong>
                    <span style={{ color: 'var(--color-red)', fontWeight: 'bold', fontSize: '14px' }}>
                      정답률: {q.correct_rate}%
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>뜻: {q.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Today's Idioms Learning Review --- */}
        <div className="card" style={{ borderTop: '8px solid var(--color-green)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#1e7e34', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} /> 오늘 배운 관용어 핵심 정리 📚
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {question_analytics.map(q => (
              <div 
                key={q.question_id}
                style={{ 
                  padding: '16px', 
                  background: '#f7fafc', 
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--color-green)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '18px', color: 'var(--color-navy)' }}>“{q.idiom}”</strong>
                  <span style={{ fontSize: '12px', background: 'rgba(46, 204, 113, 0.1)', color: 'var(--color-green)', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                    정답률: {q.correct_rate}%
                  </span>
                </div>
                
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  <strong>뜻: </strong> {q.explanation}
                </div>
                
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'white', padding: '10px', borderRadius: '6px', fontStyle: 'italic' }}>
                  <strong>예문: </strong> "{q.example_sentence}"
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Restart button --- */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
          <button 
            onClick={onRestart} 
            className="btn btn-purple btn-large"
            style={{ maxWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={20} />
            다시 하기 (처음으로)
          </button>
        </div>

      </div>
    </div>
  );
}
