const API_BASE = 'http://localhost:5000/api';

export const createGame = async (title, teamCount) => {
  const res = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, team_count: teamCount })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '게임방 생성에 실패했습니다.');
  }
  return res.json();
};

export const joinGame = async (gameCode, nickname) => {
  const res = await fetch(`${API_BASE}/games/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_code: gameCode, nickname })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '게임방 입장에 실패했습니다.');
  }
  return res.json();
};

export const getGameDetails = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}`);
  if (!res.ok) throw new Error('게임방 정보를 가져오지 못했습니다.');
  return res.json();
};

export const startGame = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/start`, { method: 'POST' });
  if (!res.ok) throw new Error('게임 시작에 실패했습니다.');
  return res.json();
};

export const getCurrentQuestion = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/questions/current`);
  if (!res.ok) throw new Error('현재 문제를 가져오지 못했습니다.');
  return res.json();
};

export const revealAnswer = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/reveal`, { method: 'POST' });
  if (!res.ok) throw new Error('정답 공개에 실패했습니다.');
  return res.json();
};

export const nextQuestion = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/next`, { method: 'POST' });
  if (!res.ok) throw new Error('다음 문제 이동에 실패했습니다.');
  return res.json();
};

export const finishGame = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/finish`, { method: 'POST' });
  if (!res.ok) throw new Error('게임 종료 처리에 실패했습니다.');
  return res.json();
};

export const getGameResult = async (gameId) => {
  const res = await fetch(`${API_BASE}/games/${gameId}/result`);
  if (!res.ok) throw new Error('최종 결과를 가져오지 못했습니다.');
  return res.json();
};
