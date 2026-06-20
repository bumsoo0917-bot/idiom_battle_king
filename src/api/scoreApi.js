import { db } from '../firebase';
import { ref, get, set, update, runTransaction } from 'firebase/database';

// 1. Submit answer (Atomic transaction to ensure scores are computed and synced accurately)
export const submitAnswer = async ({ student_id, game_id, question_id, selected_choice, response_time }) => {
  // Fetch question details
  const qSnapshot = await get(ref(db, `questions/${question_id}`));
  if (!qSnapshot.exists()) {
    throw new Error('문제를 찾을 수 없습니다.');
  }
  const question = qSnapshot.val();

  // Evaluate correctness
  const isCorrect = parseInt(selected_choice) === question.correct_answer;
  let scoreAdded = 0;

  // Transaction to update student scores and team scores
  const studentRef = ref(db, `rooms/${game_id}/students/${student_id}`);
  let finalResult = null;

  await runTransaction(studentRef, (student) => {
    if (!student) return;

    let newStreak = student.streak_count || 0;
    
    if (isCorrect) {
      // 1. Base score by level
      if (question.level === 'EASY') scoreAdded = 100;
      else if (question.level === 'NORMAL') scoreAdded = 150;
      else if (question.level === 'HARD') scoreAdded = 200;

      // 2. Speed bonus
      if (response_time <= 10) scoreAdded += 30;
      else if (response_time <= 20) scoreAdded += 10;

      // 3. Streak bonus
      newStreak += 1;
      if (newStreak % 3 === 0 && newStreak > 0) {
        scoreAdded += 50;
      }
    } else {
      newStreak = 0;
    }

    student.score = (student.score || 0) + scoreAdded;
    student.correct_count = (student.correct_count || 0) + (isCorrect ? 1 : 0);
    student.streak_count = newStreak;

    finalResult = {
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      example_sentence: question.example_sentence,
      score_added: scoreAdded,
      total_score: student.score,
      streak_count: newStreak,
      team_id: student.team_id
    };

    return student;
  });

  if (!finalResult) {
    throw new Error('점수 갱신에 실패했습니다.');
  }

  // Update Team Score
  if (scoreAdded > 0 && finalResult.team_id) {
    const teamRef = ref(db, `rooms/${game_id}/teams/${finalResult.team_id}`);
    await runTransaction(teamRef, (team) => {
      if (!team) return;
      team.score = (team.score || 0) + scoreAdded;
      return team;
    });
  }

  // Log answer
  const answerPayload = {
    selected_choice: parseInt(selected_choice),
    is_correct: isCorrect,
    response_time,
    score_added: scoreAdded,
    submitted_at: new Date().toISOString()
  };

  await set(ref(db, `rooms/${game_id}/answers/question_${question_id}/${student_id}`), answerPayload);
  
  // Update submission helper count
  await set(ref(db, `rooms/${game_id}/current_question_submissions/${student_id}`), true);

  return finalResult;
};

// 2. Get current scoreboard
export const getScoreboard = async (gameId) => {
  const snapshot = await get(ref(db, `rooms/${gameId}`));
  if (!snapshot.exists()) {
    throw new Error('점수판을 불러올 수 없습니다.');
  }
  const room = snapshot.val();
  const teams = room.teams ? Object.values(room.teams).sort((a, b) => b.score - a.score) : [];
  const students = room.students ? Object.values(room.students).sort((a, b) => b.score - a.score) : [];

  return { teams, students };
};
