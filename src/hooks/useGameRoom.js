import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export const useGameRoom = (gameCode, role, nickname) => {
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, QUESTION, REVEALED, FINISHED
  const [submissionStats, setSubmissionStats] = useState({ submittedCount: 0, totalStudents: 0 });
  const [revealedData, setRevealedData] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    if (!gameCode) return;

    const roomRef = ref(db, `rooms/${gameCode}`);
    
    // Register Firebase Realtime listener on the entire room object
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const room = snapshot.val();

      // 1. Sync Student list
      const studentsList = room.students ? Object.values(room.students) : [];
      setJoinedStudents(studentsList.map(s => {
        // Find team detail
        const team = room.teams && room.teams[s.team_id] ? room.teams[s.team_id] : {};
        return {
          student_id: s.student_id,
          nickname: s.nickname,
          team_name: team.team_name || '대기',
          team_color: team.team_color || '#ccc'
        };
      }));

      // 2. Sync Question State
      if (room.current_question) {
        // Exclude correct_answer for students to prevent cheating if they peek at the React state
        const qData = { ...room.current_question };
        if (role === 'student' && !room.revealed) {
          delete qData.correct_answer;
          delete qData.explanation;
          delete qData.example_sentence;
        }
        setCurrentQuestion(qData);
      } else {
        setCurrentQuestion(null);
      }
      setQuestionIndex(room.current_question_index !== undefined ? room.current_question_index : -1);

      // 3. Sync Game State
      const status = room.status || 'WAITING';
      const revealed = room.revealed || false;

      if (status === 'WAITING') {
        setGameState('LOBBY');
      } else if (status === 'PLAYING') {
        if (revealed) {
          setGameState('REVEALED');
          if (room.current_question) {
            setRevealedData({
              correctAnswer: room.current_question.correct_answer,
              explanation: room.current_question.explanation,
              exampleSentence: room.current_question.example_sentence
            });
          }
        } else {
          setGameState('QUESTION');
          setRevealedData(null);
        }
      } else if (status === 'FINISHED') {
        setGameState('FINISHED');
        setGameFinished(true);
      }

      // 4. Sync submission statistics
      const totalStudents = studentsList.length;
      const submissions = room.current_question_submissions ? Object.keys(room.current_question_submissions).length : 0;
      setSubmissionStats({
        submittedCount: submissions,
        totalStudents: totalStudents
      });

    }, (error) => {
      console.error('Error listening to game room updates:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [gameCode, role, nickname]);

  return {
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
