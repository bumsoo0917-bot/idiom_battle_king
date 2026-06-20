import React, { useState, useEffect } from 'react';
import { Play, SkipForward, CheckSquare, Trophy, Plus, ArrowLeft, Users, Key, PlayCircle, Library } from 'lucide-react';
import Header from '../components/Header';
import ScoreBoard from '../components/ScoreBoard';
import { createGame, getGameDetails, startGame, revealAnswer, nextQuestion, finishGame } from '../api/gameApi';
import { useGameRoom } from '../hooks/useGameRoom';
import { useRealtimeScore } from '../hooks/useRealtimeScore';

export default function TeacherDashboardPage({ onNavigate, onTeacherSetup }) {
  // Creation States
  const [title, setTitle] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [createdRoom, setCreatedRoom] = useState(null);
  
  // Game running state
  const [gameDetails, setGameDetails] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showScoreboardTab, setShowScoreboardTab] = useState(false);

  // Hook for real-time room sync
  const socketHook = useGameRoom(
    createdRoom ? createdRoom.game_code : null,
    'teacher',
    '선생님'
  );

  const {
    joinedStudents,
    setJoinedStudents,
    currentQuestion,
    setCurrentQuestion,
    questionIndex,
    setQuestionIndex,
    gameState,
    setGameState,
    submissionStats,
    setSubmissionStats,
    revealedData,
    setRevealedData
  } = socketHook;

  // Real-time Score hook
  const { teams, students, refresh: refreshScores } = useRealtimeScore(
    createdRoom ? createdRoom.game_id : null,
    refreshTrigger
  );

  // 1. Fetch details on room creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('게임방 제목을 입력해 주세요.');

    try {
      const room = await createGame(title.trim(), teamCount);
      setCreatedRoom(room);
      onTeacherSetup(room);

      // Load initial details
      const details = await getGameDetails(room.game_id);
      setGameDetails(details);
      setSubmissionStats({ submittedCount: 0, totalStudents: 0 });
    } catch (err) {
      alert(err.message || '게임방 생성에 실패했습니다.');
    }
  };

  // Sync details from database when a student joins
  useEffect(() => {
    if (joinedStudents.length > 0 && createdRoom) {
      // Re-fetch details to sync names and teams properly
      getGameDetails(createdRoom.game_id).then(details => {
        setGameDetails(details);
        setSubmissionStats(prev => ({
          ...prev,
          totalStudents: details.students.length
        }));
        // Refresh scoreboards
        refreshScores();
      });
    }
  }, [joinedStudents, createdRoom]);

  // Handle Game start
  const handleStartGame = async () => {
    if (!createdRoom) return;
    try {
      const res = await startGame(createdRoom.game_id);
      setGameState('QUESTION');
      setCurrentQuestion(res.question);
      setQuestionIndex(0);
      setSubmissionStats({ submittedCount: 0, totalStudents: joinedStudents.length });
    } catch (err) {
      alert('게임을 시작하는 도중 오류가 발생했습니다.');
    }
  };

  // Handle Reveal Answer
  const handleRevealAnswer = async () => {
    if (!createdRoom) return;
    try {
      await revealAnswer(createdRoom.game_id);
      setGameState('REVEALED');
      // Refresh scoreboards to fetch updated scores from answers
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert('정답 공개 도중 오류가 발생했습니다.');
    }
  };

  // Handle Next Question
  const handleNextQuestion = async () => {
    if (!createdRoom) return;
    try {
      const res = await nextQuestion(createdRoom.game_id);
      setGameState('QUESTION');
      setCurrentQuestion(res.question);
      setQuestionIndex(res.questionIndex);
      setRevealedData(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert('다음 문제로 이동 도중 오류가 발생했습니다.');
    }
  };

  // Handle Finish Game
  const handleFinishGame = async () => {
    if (!createdRoom) return;
    if (confirm('게임을 종료하고 최종 결과를 산출하시겠습니까?')) {
      try {
        await finishGame(createdRoom.game_id);
        setGameState('FINISHED');
        onNavigate('FINAL_RESULT');
      } catch (err) {
        alert('게임 종료 도중 오류가 발생했습니다.');
      }
    }
  };

  const handleExit = () => {
    if (createdRoom && gameState !== 'FINISHED') {
      if (!confirm('방을 나가면 진행 중인 게임이 중단됩니다. 나가시겠습니까?')) {
        return;
      }
    }
    setCreatedRoom(null);
    setGameDetails(null);
    onNavigate('HOME');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        gameCode={createdRoom ? createdRoom.game_code : null} 
        nickname="선생님"
        onExit={handleExit} 
      />

      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* --- Phase 1: Room Creation form --- */}
        {!createdRoom && (
          <div className="card animate-pop" style={{ borderTop: '8px solid var(--color-purple)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <button 
                onClick={() => onNavigate('HOME')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={24} />
              </button>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>새 게임 만들기 (교사용)</h2>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label className="form-label" htmlFor="roomTitle">
                  게임 제목
                </label>
                <input 
                  type="text" 
                  id="roomTitle"
                  className="form-input"
                  placeholder="예: 6학년 1반 관용어 대결왕!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="teamCount">
                  대결 팀 수 설정
                </label>
                <select 
                  id="teamCount" 
                  className="form-input"
                  value={teamCount}
                  onChange={(e) => setTeamCount(parseInt(e.target.value))}
                  style={{ cursor: 'pointer' }}
                >
                  <option value={2}>2개 팀 (청룡, 백호)</option>
                  <option value={3}>3개 팀 (청룡, 백호, 주작)</option>
                  <option value={4}>4개 팀 (청룡, 백호, 주작, 현무)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-purple btn-large" style={{ marginTop: '12px' }}>
                <Plus size={20} /> 게임방 개설하기
              </button>
            </form>
          </div>
        )}

        {/* --- Phase 2: Active Room Control --- */}
        {createdRoom && (
          <div className="animate-slide">
            
            {/* LOBBY / WAITING SCREEN */}
            {gameState === 'LOBBY' && (
              <div className="card" style={{ textAlign: 'center', borderTop: '8px solid var(--color-purple)' }}>
                <span className="badge badge-normal" style={{ marginBottom: '12px' }}>대기방 오픈됨</span>
                
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--color-navy)', marginBottom: '4px' }}>
                  {title}
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: '2px solid #cbd5e0' }}>
                  <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>학생 참여 코드</span>
                  <strong style={{ fontSize: '48px', color: 'var(--color-purple)', letterSpacing: '4px', margin: '8px 0', fontFamily: 'monospace' }}>
                    {createdRoom.game_code}
                  </strong>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    학생들에게 <strong>{createdRoom.game_code}</strong> 코드를 입력하여 입장하라고 안내해주세요.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
                  <button 
                    onClick={handleStartGame} 
                    className="btn btn-green btn-large"
                    disabled={joinedStudents.length === 0}
                    style={{ opacity: joinedStudents.length === 0 ? 0.6 : 1 }}
                  >
                    <PlayCircle size={24} />
                    게임 시작하기 🚀
                  </button>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '2px solid #edf2f7', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} />
                    참여 중인 학생 ({joinedStudents.length}명)
                  </h3>
                  
                  {joinedStudents.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                      학생들이 입장하기를 기다리는 중입니다...
                    </p>
                  ) : (
                    <div className="lobby-student-grid">
                      {joinedStudents.map((s) => (
                        <div 
                          key={s.student_id} 
                          className="lobby-student-card"
                          style={{ borderLeft: `4px solid ${s.team_color}` }}
                        >
                          <span>{s.nickname}</span>
                          <div style={{ fontSize: '11px', color: s.team_color, marginTop: '2px', fontWeight: '800' }}>
                            {s.team_name.split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PLAYING SCREEN */}
            {(gameState === 'QUESTION' || gameState === 'REVEALED') && currentQuestion && (
              <div>
                {/* Control Panel Card */}
                <div className="card" style={{ borderTop: '8px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--color-navy)', fontSize: '18px' }}>
                      문제 {questionIndex + 1} / 6
                    </span>
                    <span className="badge badge-normal">
                      제출 현황: {submissionStats.submittedCount} / {submissionStats.totalStudents} 명
                    </span>
                  </div>

                  <div style={{ padding: '16px', background: '#f7fafc', borderRadius: '12px', marginBottom: '24px', borderLeft: '5px solid var(--color-primary)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>제시된 퀴즈 문항</span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
                      {currentQuestion.question_text}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      관용어: <strong>{currentQuestion.idiom}</strong> | 난이도: <strong>{currentQuestion.level}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {gameState === 'QUESTION' ? (
                      <button 
                        onClick={handleRevealAnswer} 
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                      >
                        <CheckSquare size={20} />
                        정답 공개하기
                      </button>
                    ) : (
                      <>
                        {questionIndex < 5 ? (
                          <button 
                            onClick={handleNextQuestion} 
                            className="btn btn-green"
                            style={{ flex: 1 }}
                          >
                            <SkipForward size={20} />
                            다음 문제로 이동 ➔
                          </button>
                        ) : (
                          <button 
                            onClick={handleFinishGame} 
                            className="btn btn-red"
                            style={{ flex: 1 }}
                          >
                            <Trophy size={20} />
                            최종 결과 확인 ➔
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Scoreboard and detailed player lists */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => setShowScoreboardTab(false)} 
                    className={`btn ${!showScoreboardTab ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px 16px', fontSize: '15px' }}
                  >
                    실시간 제출자 현황
                  </button>
                  <button 
                    onClick={() => setShowScoreboardTab(true)} 
                    className={`btn ${showScoreboardTab ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px 16px', fontSize: '15px' }}
                  >
                    팀 대결 점수판
                  </button>
                </div>

                {!showScoreboardTab ? (
                  <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>실시간 제출 상태</h3>
                    {gameDetails && gameDetails.students ? (
                      <div className="lobby-student-grid">
                        {gameDetails.students.map(s => {
                          // We need to check if they have submitted for the current question
                          // For simplicity, during real-time we can check socket or assume submission
                          // Or we can just list the students and their team color
                          return (
                            <div 
                              key={s.student_id} 
                              className="lobby-student-card"
                              style={{ 
                                borderLeft: `4px solid ${s.team_color}`,
                                background: '#fff'
                              }}
                            >
                              <span>{s.nickname}</span>
                              <div style={{ fontSize: '11px', color: s.team_color, fontWeight: '800' }}>
                                {s.team_name.split(' ')[0]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p>학생 목록을 로드하는 중...</p>
                    )}
                  </div>
                ) : (
                  <ScoreBoard 
                    teams={teams} 
                    students={students} 
                    remainingQuestions={5 - questionIndex} 
                  />
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
