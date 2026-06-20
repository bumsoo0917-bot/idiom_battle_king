const API_BASE = 'http://localhost:5000/api';

export const getQuestions = async () => {
  const res = await fetch(`${API_BASE}/questions`);
  if (!res.ok) throw new Error('문제 목록을 가져오지 못했습니다.');
  return res.json();
};

export const createQuestion = async (questionData) => {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  if (!res.ok) throw new Error('문제 생성에 실패했습니다.');
  return res.json();
};

export const updateQuestion = async (questionId, questionData) => {
  const res = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  if (!res.ok) throw new Error('문제 수정에 실패했습니다.');
  return res.json();
};

export const deleteQuestion = async (questionId) => {
  const res = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('문제 삭제에 실패했습니다.');
  return res.json();
};
