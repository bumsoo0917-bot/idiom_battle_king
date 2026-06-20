import React from 'react';
import { Trophy, Users, Star } from 'lucide-react';

export default function ScoreBoard({ teams = [], students = [], remainingQuestions = null }) {
  // Sort teams by score desc
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  // Sort students by score desc
  const sortedStudents = [...students].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="scoreboard-container animate-slide">
      <div className="scoreboard-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy color="#f1c40f" size={24} fill="#f1c40f" />
          <span>실시간 점수판</span>
        </div>
        {remainingQuestions !== null && (
          <span style={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px' }}>
            남은 문제: {remainingQuestions}개
          </span>
        )}
      </div>

      {/* Team score list */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px', fontWeight: 'bold' }}>팀별 랭킹</h4>
        <div className="team-list">
          {sortedTeams.map((team, idx) => (
            <div 
              key={team.team_id} 
              className="team-row" 
              style={{ borderLeft: `6px solid ${team.team_color || '#4A90E2'}` }}
            >
              <div className="team-info">
                <span style={{ fontWeight: '800', fontSize: '18px', color: '#f1c40f' }}>{idx + 1}위</span>
                <span className="team-name">{team.team_name}</span>
              </div>
              <span className="team-score">{team.score}점</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 students list */}
      {sortedStudents.length > 0 && (
        <div>
          <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> 개인 TOP 5
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedStudents.map((student, idx) => (
              <div 
                key={student.student_id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  background: 'rgba(255,255,255,0.04)', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: idx === 0 ? '#f1c40f' : 'rgba(255,255,255,0.5)' }}>{idx + 1}등</span>
                  <span>{student.nickname}</span>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      backgroundColor: student.team_color, 
                      color: 'white', 
                      padding: '1px 6px', 
                      borderRadius: '8px', 
                      fontWeight: '800' 
                    }}
                  >
                    {student.team_name ? student.team_name.split(' ')[0] : '무소속'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  <span>{student.score}점</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-green)' }}>({student.correct_count}문제)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
