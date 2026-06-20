import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

export const useGameRoom = (gameCode, role, nickname) => {
  const [socket, setSocket] = useState(null);
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, QUESTION, REVEALED, FINISHED
  const [submissionStats, setSubmissionStats] = useState({ submittedCount: 0, totalStudents: 0 });
  const [revealedData, setRevealedData] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    if (!gameCode) return;

    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    // Join Room
    newSocket.emit('join_room', { gameCode, role, nickname });

    // Listeners
    newSocket.on('student_joined', (student) => {
      setJoinedStudents((prev) => {
        // Prevent duplicate entries
        if (prev.some(s => s.student_id === student.student_id)) return prev;
        return [...prev, student];
      });
      // Increment student count in submission stats
      setSubmissionStats(prev => ({
        ...prev,
        totalStudents: prev.totalStudents + 1
      }));
    });

    newSocket.on('game_started', ({ question, questionIndex }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setGameState('QUESTION');
      setRevealedData(null);
      setSubmissionStats({ submittedCount: 0, totalStudents: 0 }); // Will sync or load when fetching details
    });

    newSocket.on('student_submitted', ({ submittedCount, totalStudents }) => {
      setSubmissionStats({ submittedCount, totalStudents });
    });

    newSocket.on('reveal_answer', (data) => {
      setRevealedData(data);
      setGameState('REVEALED');
    });

    newSocket.on('new_question', ({ question, questionIndex }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setGameState('QUESTION');
      setRevealedData(null);
      // Reset submissions
      setSubmissionStats(prev => ({
        ...prev,
        submittedCount: 0
      }));
    });

    newSocket.on('game_finished', () => {
      setGameState('FINISHED');
      setGameFinished(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameCode, role, nickname]);

  return {
    socket,
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
    setRevealedData,
    gameFinished
  };
};
