import React, { useEffect, useState } from 'react';
import { Loader2, Users, Shield } from 'lucide-react';
import Header from '../components/Header';
import { getGameDetails } from '../api/gameApi';
import TeamBadge from '../components/TeamBadge';

export default function StudentWaitingPage({ 
  studentData, 
  socketHook, 
  onNavigate, 
  onGameStarted 
}) {
  const { game_id, nickname, team_name, team_color, game_code } = studentData;
  const [gameTitle, setGameTitle] = useState('관용어 대결왕 게임방');
  const [allStudents, setAllStudents] = useState([]);
  
  // Destructure socket hook values
  const { joinedStudents, setJoinedStudents, currentQuestion, gameState } = socketHook;

  // 1. Fetch initial details of the game room
  useEffect(() => {
    const fetchLobbyDetails = async () => {
      try {
        const details = await getGameDetails(game_id);
        setGameTitle(details.game.title);
        setAllStudents(details.students || []);
        
        // Populate socket list with existing students
        const mapped = details.students.map(s => ({
          student_id: s.student_id,
          nickname: s.nickname,
          team_name: s.team_name,
          team_color: s.team_color
        }));
        setJoinedStudents(mapped);
      } catch (err) {
        console.error('Failed to load lobby details', err);
      }
    };
    fetchLobbyDetails();
  }, [game_id, setJoinedStudents]);

  // 2. Sync socket state change
  useEffect(() => {
    if (gameState === 'QUESTION' && currentQuestion) {
      onGameStarted(currentQuestion);
      onNavigate('STUDENT_QUIZ');
    }
  }, [gameState, currentQuestion, onNavigate, onGameStarted]);

  // Merge rest of students in real-time
  useEffect(() => {
    if (joinedStudents.length > 0) {
      setAllStudents(joinedStudents);
    }
  }, [joinedStudents]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header gameCode={game_code} nickname={nickname} teamName={team_name} teamColor={team_color} />
      <div className="container" style={{ maxWidth: '650px', justifyContent: 'center' }}>
        
        <div className="card animate-pop" style={{ textAlign: 'center', borderTop: '8px solid var(--color-purple)' }}>
          <span 
            style={{ 
              fontSize: '13px', 
              backgroundColor: 'rgba(155, 89, 182, 0.1)', 
              color: 'var(--color-purple)', 
              padding: '6px 14px', 
              borderRadius: '9999px',
              fontWeight: '800'
            }}
          >
            게임 대기실
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-navy)', margin: '16px 0 8px' }}>
            {gameTitle}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', margin: '20px 0' }}>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>내 팀 배정:</span>
            <TeamBadge name={team_name} color={team_color} />
          </div>

          <div 
            style={{ 
              background: 'var(--bg-secondary)', 
              padding: '20px', 
              borderRadius: 'var(--border-radius-sm)', 
              marginBottom: '28px',
              border: '2px dashed #cbd5e0'
            }}
          >
            <Loader2 className="animate-bounce" size={32} color="var(--color-purple)" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              선생님이 게임을 시작하기를 기다리고 있어요
</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              선생님이 게임을 시작하면 자동으로 퀴즈 화면으로 이동합니다!
            </p>
          </div>

          {/* Joined students count */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={18} />
                함께 대기 중인 친구들 ({allStudents.length}명)
              </h4>
            </div>
            
            <div className="lobby-student-grid">
              {allStudents.map((student) => (
                <div 
                  key={student.student_id} 
                  className="lobby-student-card"
                  style={{ borderLeft: `4px solid ${student.team_color}` }}
                >
                  <span style={{ fontSize: '15px' }}>{student.nickname}</span>
                  <div style={{ fontSize: '11px', color: student.team_color, marginTop: '2px', fontWeight: '800' }}>
                    {student.team_name ? student.team_name.split(' ')[0] : '대기'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
