const API_BASE = 'http://localhost:5000/api';

export const submitAnswer = async (answerData) => {
  // answerData: { student_id, game_id, question_id, selected_choice, response_time }
  const res = await fetch(`${API_BASE}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answerData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '답안 제출에 실패했습니다.');
  }
  return res.json();
};

export const getScoreboard = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/scoreboard`);
  if (!res.ok) throw new Error('점수판을 가져오지 못했습니다.');
  return res.json();
};
