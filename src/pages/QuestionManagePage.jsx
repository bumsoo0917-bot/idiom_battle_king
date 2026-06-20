import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit2, Plus, Check } from 'lucide-react';
import Header from '../components/Header';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../api/questionApi';

export default function QuestionManagePage({ onNavigate }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [idiom, setIdiom] = useState('');
  const [type, setType] = useState('MEANING');
  const [level, setLevel] = useState('EASY');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  
  // Choices inputs
  const [choice1, setChoice1] = useState('');
  const [choice2, setChoice2] = useState('');
  const [choice3, setChoice3] = useState('');
  const [choice4, setChoice4] = useState('');

  const loadQuestionsData = async () => {
    setLoading(true);
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (err) {
      alert('문제 목록을 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionsData();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setIdiom('');
    setType('MEANING');
    setLevel('EASY');
    setQuestionText('');
    setExplanation('');
    setExampleSentence('');
    setTimeLimit(30);
    setCorrectAnswer(1);
    setChoice1('');
    setChoice2('');
    setChoice3('');
    setChoice4('');
  };

  const handleEditClick = (q) => {
    setIsEditing(true);
    setEditingId(q.question_id);
    setIdiom(q.idiom);
    setType(q.type);
    setLevel(q.level);
    setQuestionText(q.question_text);
    setExplanation(q.explanation);
    setExampleSentence(q.example_sentence);
    setTimeLimit(q.time_limit);
    setCorrectAnswer(q.correct_answer);

    if (q.choices && q.choices.length >= 4) {
      setChoice1(q.choices[0].choice_text);
      setChoice2(q.choices[1].choice_text);
      setChoice3(q.choices[2].choice_text);
      setChoice4(q.choices[3].choice_text);
    } else {
      setChoice1('');
      setChoice2('');
      setChoice3('');
      setChoice4('');
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const choicesData = [
      { choice_number: 1, choice_text: choice1 },
      { choice_number: 2, choice_text: choice2 },
      { choice_number: 3, choice_text: choice3 },
      { choice_number: 4, choice_text: choice4 }
    ];

    if (!choice1 || !choice2 || !choice3 || !choice4) {
      return alert('모든 선택지 텍스트를 입력해주세요.');
    }

    const payload = {
      idiom,
      type,
      level,
      question_text: questionText,
      explanation,
      example_sentence: exampleSentence,
      time_limit: parseInt(timeLimit),
      correct_answer: parseInt(correctAnswer),
      choices: choicesData
    };

    try {
      if (isEditing) {
        await updateQuestion(editingId, payload);
        alert('문제가 성공적으로 수정되었습니다.');
      } else {
        await createQuestion(payload);
        alert('문제가 성공적으로 등록되었습니다.');
      }
      resetForm();
      loadQuestionsData();
    } catch (err) {
      alert(err.message || '저장에 실패했습니다.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (confirm('이 문제를 정말로 삭제하시겠습니까?')) {
      try {
        await deleteQuestion(id);
        alert('문제가 삭제되었습니다.');
        loadQuestionsData();
      } catch (err) {
        alert('문제 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div className="container" style={{ maxWidth: '850px' }}>
        
        {/* Title area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <button 
            onClick={() => onNavigate('HOME')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>문제 은행 관리</h2>
        </div>

        {/* --- Form to Add/Edit Question --- */}
        <div className="card" style={{ borderTop: '8px solid var(--color-purple)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--color-navy)' }}>
            {isEditing ? '관용어 문제 수정하기 ✏️' : '새 관용어 문제 등록하기 ➕'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">대상 관용어</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 귀가 얇다" 
                  value={idiom}
                  onChange={e => setIdiom(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">문제 유형</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="MEANING">뜻 맞히기</option>
                  <option value="SITUATION">상황 맞히기</option>
                  <option value="CONTEXT">문맥 속 선택</option>
                  <option value="OX">OX 퀴즈</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">난이도</label>
                <select className="form-input" value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="EASY">쉬움 (100점)</option>
                  <option value="NORMAL">보통 (150점)</option>
                  <option value="HARD">어려움 (200점)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">제한 시간 (초)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={timeLimit}
                  onChange={e => setTimeLimit(e.target.value)}
                  min={5}
                  max={90}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">질문 문장 (Question Text)</label>
              <textarea 
                className="form-input" 
                placeholder="예: '귀가 얇다'의 뜻으로 알맞은 것은?" 
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                required
                style={{ height: '80px', resize: 'vertical' }}
              />
            </div>

            {/* Choices configuration */}
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '12px' }}>선택지 설정 및 정답 선택</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="correctRadio" 
                    checked={correctAnswer === 1}
                    onChange={() => setCorrectAnswer(1)}
                  />
                  <span style={{ fontWeight: 'bold', width: '40px' }}>1번:</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="선택지 1의 텍스트" 
                    value={choice1} 
                    onChange={e => setChoice1(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="correctRadio" 
                    checked={correctAnswer === 2}
                    onChange={() => setCorrectAnswer(2)}
                  />
                  <span style={{ fontWeight: 'bold', width: '40px' }}>2번:</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="선택지 2의 텍스트" 
                    value={choice2} 
                    onChange={e => setChoice2(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="correctRadio" 
                    checked={correctAnswer === 3}
                    onChange={() => setCorrectAnswer(3)}
                  />
                  <span style={{ fontWeight: 'bold', width: '40px' }}>3번:</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="선택지 3의 텍스트" 
                    value={choice3} 
                    onChange={e => setChoice3(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="correctRadio" 
                    checked={correctAnswer === 4}
                    onChange={() => setCorrectAnswer(4)}
                  />
                  <span style={{ fontWeight: 'bold', width: '40px' }}>4번:</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="선택지 4의 텍스트" 
                    value={choice4} 
                    onChange={e => setChoice4(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 'bold' }}>
                ※ 정답에 해당하는 번호 좌측의 라디오 단추를 선택해주세요.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">정답 해설</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="정답이 왜 정답인지 설명해주세요" 
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">예문 활용 문장</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="예: 민수는 귀가 얇아서 친구 말만 듣는다." 
                value={exampleSentence}
                onChange={e => setExampleSentence(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                <Check size={18} /> {isEditing ? '수정 내용 저장' : '새 문제 등록'}
              </button>
              {isEditing && (
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* --- List of Existing Questions --- */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--color-navy)' }}>
            등록된 관용어 리스트 ({questions.length}개)
          </h3>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '24px 0' }}>로딩 중...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions.map((q) => (
                <div 
                  key={q.question_id} 
                  style={{ 
                    border: '1px solid #edf2f7', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    background: '#fcfcfc',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: 'var(--color-navy)' }}>{q.idiom}</strong>
                      <span className="badge badge-easy" style={{ marginLeft: '8px', fontSize: '11px', backgroundColor: q.level === 'HARD' ? 'var(--color-red)' : q.level === 'NORMAL' ? 'var(--color-orange)' : 'var(--color-green)' }}>
                        {q.level}
                      </span>
                      <span style={{ marginLeft: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        ({q.type})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => handleEditClick(q)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(q.question_id)} 
                        className="btn btn-red" 
                        style={{ padding: '6px 10px', fontSize: '12px', boxShadow: 'none' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>
                    Q: {q.question_text}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {q.choices && q.choices.map(c => (
                      <div key={c.choice_number} style={{ color: c.choice_number === q.correct_answer ? 'var(--color-green)' : 'inherit', fontWeight: c.choice_number === q.correct_answer ? 'bold' : 'normal' }}>
                        {c.choice_number}. {c.choice_text} {c.choice_number === q.correct_answer && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
