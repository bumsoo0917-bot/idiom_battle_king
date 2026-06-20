const API_BASE = 'http://localhost:5000/api'; // Not used anymore, replaced by Firebase SDK
import { db } from '../firebase';
import { ref, get, set, update, remove, child, runTransaction } from 'firebase/database';
import { getQuestions } from './questionApi';

// Helper to generate random game code (6 characters, alphanumeric)
function generateGameCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Create game room
export const createGame = async (title, teamCount) => {
  let gameCode;
  let codeExists = true;

  // Find a unique game code
  while (codeExists) {
    gameCode = generateGameCode();
    const snapshot = await get(ref(db, `rooms/${gameCode}`));
    if (!snapshot.exists()) {
      codeExists = false;
    }
  }

  const teamConfigs = [
    { team_id: 'team_1', team_name: '청룡팀 (청색)', team_color: '#4A90E2', score: 0 },
    { team_id: 'team_2', team_name: '백호팀 (백색)', team_color: '#9B59B6', score: 0 },
    { team_id: 'team_3', team_name: '주작팀 (적색)', team_color: '#E74C3C', score: 0 },
    { team_id: 'team_4', team_name: '현무팀 (녹색)', team_color: '#2ECC71', score: 0 }
  ];

  const teams = {};
  for (let i = 0; i < teamCount; i++) {
    const config = teamConfigs[i % teamConfigs.length];
    teams[config.team_id] = config;
  }

  const roomData = {
    game_id: gameCode, // Use code as ID directly
    game_code: gameCode,
    title,
    status: 'WAITING',
    current_question_index: -1,
    revealed: false,
    teams,
    created_at: new Date().toISOString()
  };

  await set(ref(db, `rooms/${gameCode}`), roomData);
  return {
    game_id: gameCode,
    title,
    game_code: gameCode,
    status: 'WAITING',
    team_count: teamCount
  };
};

// 2. Join game room (Atomic Transaction to prevent race conditions in team assignment)
export const joinGame = async (gameCode, nickname) => {
  const cleanCode = gameCode.trim().toUpperCase();
  const cleanNickname = nickname.trim();
  const roomRef = ref(db, `rooms/${cleanCode}`);

  let resultStudent = null;

  await runTransaction(roomRef, (room) => {
    if (!room) return; // Room doesn't exist
    if (room.status !== 'WAITING') return; // Game already running/ended

    // Verify duplicate nickname
    const students = room.students || {};
    const exists = Object.values(students).some(s => s.nickname === cleanNickname);
    if (exists) {
      throw new Error('DUPLICATE_NICKNAME');
    }

    // Auto-balance: Assign to team with fewest students
    const teams = room.teams || {};
    const teamIds = Object.keys(teams);
    if (teamIds.length === 0) return;

    // Calculate student count per team
    const teamCounts = {};
    teamIds.forEach(id => {
      teamCounts[id] = 0;
    });

    Object.values(students).forEach(s => {
      if (s.team_id && teamCounts[s.team_id] !== undefined) {
        teamCounts[s.team_id]++;
      }
    });

    // Find team with min count
    let minTeamId = teamIds[0];
    let minCount = teamCounts[minTeamId];

    teamIds.forEach(id => {
      if (teamCounts[id] < minCount) {
        minTeamId = id;
        minCount = teamCounts[id];
      }
    });

    const assignedTeam = teams[minTeamId];
    
    // Generate new student ID
    const studentId = 'student_' + Math.random().toString(36).substr(2, 9);
    const newStudent = {
      student_id: studentId,
      game_id: cleanCode,
      nickname: cleanNickname,
      team_id: minTeamId,
      score: 0,
      correct_count: 0,
      streak_count: 0,
      created_at: new Date().toISOString()
    };

    if (!room.students) {
      room.students = {};
    }
    room.students[studentId] = newStudent;

    resultStudent = {
      student_id: studentId,
      game_id: cleanCode,
      nickname: cleanNickname,
      team_id: minTeamId,
      team_name: assignedTeam.team_name,
      team_color: assignedTeam.team_color,
      game_code: cleanCode
    };

    return room;
  });

  if (!resultStudent) {
    throw new Error('대기 중인 게임방을 찾을 수 없거나 이미 진행 중입니다.');
  }

  return resultStudent;
};

// 3. Get room details
export const getGameDetails = async (gameId) => {
  const snapshot = await get(ref(db, `rooms/${gameId}`));
  if (!snapshot.exists()) {
    throw new Error('게임방을 찾을 수 없습니다.');
  }

  const room = snapshot.val();
  const teams = room.teams ? Object.values(room.teams) : [];
  const students = room.students ? Object.values(room.students) : [];
  
  // Count total questions
  const questions = await getQuestions();

  return {
    game: {
      game_id: room.game_id,
      title: room.title,
      game_code: room.game_code,
      status: room.status,
      current_question_index: room.current_question_index
    },
    teams,
    students,
    total_questions: questions.length
  };
};

// 4. Start game
export const startGame = async (gameId) => {
  const questions = await getQuestions();
  const sortedQ = [...questions].sort((a, b) => a.question_id - b.question_id);
  const firstQuestion = sortedQ[0];

  if (!firstQuestion) {
    throw new Error('게임에 연결된 문제가 없습니다.');
  }

  // Remove correct answer from firstQuestion for students (in RTDB room state we can just save it)
  const roomUpdates = {
    status: 'PLAYING',
    current_question_index: 0,
    current_question: firstQuestion,
    revealed: false
  };

  await update(ref(db, `rooms/${gameId}`), roomUpdates);
  return { message: '게임이 시작되었습니다.', question: firstQuestion };
};

// 5. Get current question
export const getCurrentQuestion = async (gameId) => {
  const snapshot = await get(ref(db, `rooms/${gameId}/current_question`));
  if (!snapshot.exists()) {
    throw new Error('현재 문제를 불러올 수 없습니다.');
  }
  return snapshot.val();
};

// 6. Reveal answer
export const revealAnswer = async (gameId) => {
  await set(ref(db, `rooms/${gameId}/revealed`), true);
  return { message: '정답이 공개되었습니다.' };
};

// 7. Move to next question
export const nextQuestion = async (gameId) => {
  const roomSnapshot = await get(ref(db, `rooms/${gameId}`));
  const room = roomSnapshot.val();

  const nextIndex = room.current_question_index + 1;
  const questions = await getQuestions();
  const sortedQ = [...questions].sort((a, b) => a.question_id - b.question_id);
  
  if (nextIndex >= sortedQ.length) {
    throw new Error('더 이상 문제가 없습니다. 게임을 종료해주세요.');
  }

  const nextQ = sortedQ[nextIndex];

  // Reset answer submissions for this new question in RTDB
  const roomUpdates = {
    current_question_index: nextIndex,
    current_question: nextQ,
    revealed: false,
    current_question_submissions: null // Reset submissions count helper
  };

  await update(ref(db, `rooms/${gameId}`), roomUpdates);
  // Clear actual submissions path in database
  await remove(ref(db, `rooms/${gameId}/answers/question_${nextQ.question_id}`));

  return { message: '다음 문제로 이동했습니다.', question: nextQ, questionIndex: nextIndex };
};

// 8. Finish game and compute results
export const finishGame = async (gameId) => {
  const roomSnapshot = await get(ref(db, `rooms/${gameId}`));
  const room = roomSnapshot.val();

  const teams = room.teams ? Object.values(room.teams) : [];
  const students = room.students ? Object.values(room.students) : [];
  const questions = await getQuestions();

  // Find winner team
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winnerTeam = sortedTeams[0] || null;

  // Calculate average student score
  const totalScore = students.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const averageScore = students.length > 0 ? totalScore / students.length : 0;

  // Analyze difficult questions
  const difficultQuestions = [];
  const answersObj = room.answers || {};

  for (const q of questions) {
    const qAnswers = answersObj[`question_${q.question_id}`] ? Object.values(answersObj[`question_${q.question_id}`]) : [];
    const total = qAnswers.length;
    const correct = qAnswers.filter(a => a.is_correct === true).length;
    const rate = total > 0 ? (correct / total) * 100 : 100;

    if (rate < 60) {
      difficultQuestions.push({
        question_id: q.question_id,
        idiom: q.idiom,
        correct_rate: parseFloat(rate.toFixed(1))
      });
    }
  }

  const results = {
    winner_team_id: winnerTeam ? winnerTeam.team_id : null,
    total_questions: questions.length,
    average_score: parseFloat(averageScore.toFixed(1)),
    difficult_questions: JSON.stringify(difficultQuestions),
    created_at: new Date().toISOString()
  };

  const roomUpdates = {
    status: 'FINISHED',
    results
  };

  await update(ref(db, `rooms/${gameId}`), roomUpdates);
  return { message: '게임이 종료되었습니다.', winner_team_id: winnerTeam?.team_id };
};

// 9. Get final results
export const getGameResult = async (gameId) => {
  const snapshot = await get(ref(db, `rooms/${gameId}`));
  if (!snapshot.exists()) {
    throw new Error('결과를 가져올 수 없습니다.');
  }

  const room = snapshot.val();
  const results = room.results;
  if (!results) {
    throw new Error('최종 결과가 요약되지 않았습니다.');
  }

  const winnerTeam = room.teams[results.winner_team_id] || null;
  const teams = room.teams ? Object.values(room.teams).sort((a,b) => b.score - a.score) : [];
  const students = room.students ? Object.values(room.students).sort((a,b) => b.score - a.score) : [];
  const questions = await getQuestions();

  const analytics = [];
  const answersObj = room.answers || {};

  for (const q of questions) {
    const qAnswers = answersObj[`question_${q.question_id}`] ? Object.values(answersObj[`question_${q.question_id}`]) : [];
    const total = qAnswers.length;
    const correct = qAnswers.filter(a => a.is_correct === true).length;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    analytics.push({
      ...q,
      total_answers: total,
      correct_answers: correct,
      correct_rate: rate
    });
  }

  return {
    winner_team: winnerTeam,
    average_score: results.average_score,
    total_questions: results.total_questions,
    teams,
    students,
    difficult_questions: JSON.parse(results.difficult_questions || '[]'),
    question_analytics: analytics
  };
};
