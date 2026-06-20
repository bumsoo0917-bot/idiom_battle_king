import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import StudentJoinPage from './pages/StudentJoinPage';
import StudentWaitingPage from './pages/StudentWaitingPage';
import StudentQuizPage from './pages/StudentQuizPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import QuestionManagePage from './pages/QuestionManagePage';
import FinalResultPage from './pages/FinalResultPage';
import { useGameRoom } from './hooks/useGameRoom';

export default function App() {
  const [page, setPage] = useState('HOME');
  
  // Dynamic user context
  const [studentData, setStudentData] = useState(null);
  const [teacherRoomData, setTeacherRoomData] = useState(null);

  // Global socket setup triggers when gameCode is filled
  const [gameCode, setGameCode] = useState(null);
  const [role, setRole] = useState(null);
  const [nickname, setNickname] = useState(null);

  // Instantiate socket connection once at the top level
  const socketHook = useGameRoom(gameCode, role, nickname);

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  const handleStudentJoinSuccess = (data) => {
    setStudentData(data);
    setGameCode(data.game_code);
    setRole('student');
    setNickname(data.nickname);
  };

  const handleTeacherSetup = (room) => {
    setTeacherRoomData(room);
    setGameCode(room.game_code);
    setRole('teacher');
    setNickname('선생님');
  };

  const handleGameStarted = (firstQuestion) => {
    // Student screen receives notice to start
    socketHook.setCurrentQuestion(firstQuestion);
    socketHook.setQuestionIndex(0);
    socketHook.setGameState('QUESTION');
  };

  const handleRestart = () => {
    // Reset all global states
    setStudentData(null);
    setTeacherRoomData(null);
    setGameCode(null);
    setRole(null);
    setNickname(null);
    socketHook.setGameState('LOBBY');
    socketHook.setCurrentQuestion(null);
    socketHook.setQuestionIndex(-1);
    socketHook.setJoinedStudents([]);
    setPage('HOME');
  };

  // Render active page
  switch (page) {
    case 'HOME':
      return <HomePage onNavigate={handleNavigate} />;
      
    case 'STUDENT_JOIN':
      return (
        <StudentJoinPage 
          onNavigate={handleNavigate} 
          onJoinSuccess={handleStudentJoinSuccess} 
        />
      );
      
    case 'STUDENT_WAITING':
      if (!studentData) return <HomePage onNavigate={handleNavigate} />;
      return (
        <StudentWaitingPage 
          studentData={studentData}
          socketHook={socketHook}
          onNavigate={handleNavigate}
          onGameStarted={handleGameStarted}
        />
      );
      
    case 'STUDENT_QUIZ':
      if (!studentData) return <HomePage onNavigate={handleNavigate} />;
      return (
        <StudentQuizPage 
          studentData={studentData}
          socketHook={socketHook}
          onNavigate={handleNavigate}
          onGameFinished={() => handleNavigate('FINAL_RESULT')}
        />
      );
      
    case 'TEACHER_DASHBOARD':
      return (
        <TeacherDashboardPage 
          onNavigate={handleNavigate} 
          onTeacherSetup={handleTeacherSetup}
        />
      );
      
    case 'QUESTION_MANAGE':
      return <QuestionManagePage onNavigate={handleNavigate} />;
      
    case 'FINAL_RESULT':
      const activeGameId = role === 'student' ? studentData?.game_id : teacherRoomData?.game_id;
      return (
        <FinalResultPage 
          gameId={activeGameId} 
          onRestart={handleRestart} 
        />
      );
      
    default:
      return <HomePage onNavigate={handleNavigate} />;
  }
}
