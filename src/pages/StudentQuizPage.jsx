import React, { useState, useEffect } from 'react';
import { Award, Zap, CheckCircle2, AlertTriangle, ArrowRight, Loader } from 'lucide-react';
import Header from '../components/Header';
import QuizCard from '../components/QuizCard';
import ChoiceButton from '../components/ChoiceButton';
import TimerBar from '../components/TimerBar';
import ResultModal from '../components/ResultModal';
import { useTimer } from '../hooks/useTimer';
import { submitAnswer } from '../api/scoreApi';

export default function StudentQuizPage({ 
  studentData, 
  socketHook, 
  onNavigate,
  onGameFinished
}) {
  const { student_id, game_id, nickname, team_name, team_color, game_code } = studentData;
  const { 
    currentQuestion, 
    questionIndex, 
    gameState, 
    revealedData, 
    gameFinished 
  } = socketHook;

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Time remaining count
  const limit = currentQuestion ? currentQuestion.time_limit : 30;
  
  // Timer setup
  const { secondsLeft, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer(limit, () => {
    // Timeout handler: if time is up and not submitted, submit automatically with choice 0 (incorrect)
    if (!hasSubmitted) {
      handleSubmit(true);
    }
  });

  // Start timer when a new question arrives
  useEffect(() => {
    if (currentQuestion && gameState === 'QUESTION') {
      setSelectedChoice(null);
      setHasSubmitted(false);
      setSubmissionResult(null);
      resetTimer(currentQuestion.time_limit);
      startTimer();
    }
  }, [currentQuestion, gameState]);

  // If game is finished
  useEffect(() => {
    if (gameState === 'FINISHED' || gameFinished) {
      onNavigate('FINAL_RESULT');
    }
  }, [gameState, gameFinished, onNavigate]);

  const handleSelect = (choiceNum) => {
    if (hasSubmitted) return;
    setSelectedChoice(choiceNum);
  };

  const handleSubmit = async (isTimeout = false) => {
    if (hasSubmitted || submitting) return;
    
    stopTimer();
    setSubmitting(true);

    const timeSpent = limit - secondsLeft;
    const finalChoice = isTimeout ? 0 : (selectedChoice || 0);

    try {
      const result = await submitAnswer({
        student_id,
        game_id,
        question_id: currentQuestion.question_id,
        selected_choice: finalChoice,
        response_time: timeSpent
      });

      setSubmissionResult(result);
      setHasSubmitted(true);
    } catch (err) {
      console.error('Failed to submit answer', err);
      // In case of error, retry once or force select incorrect
      setHasSubmitted(true);
      setSubmissionResult({
        is_correct: false,
        score_added: 0,
        total_score: 0,
        streak_count: 0
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header gameCode={game_code} nickname={nickname} teamName={team_name} teamColor={team_color} />
        <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Loader className="animate-bounce" size={48} style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '16px', fontWeight: 'bold' }}>문제를 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // Check if we show choices or explanation screen
  const isQuestionActive = gameState === 'QUESTION';
  const isRevealed = gameState === 'REVEALED' && revealedData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header gameCode={game_code} nickname={nickname} teamName={team_name} teamColor={team_color} />
      
      <div className="container" style={{ maxWidth: '750px' }}>
        
        {/* Current score badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            현재 닉네임: <strong>{nickname}</strong>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '16px', backgroundColor: 'var(--color-navy)', color: 'white', padding: '6px 14px', borderRadius: '12px' }}>
            <Award size={16} color="#f1c40f" />
            <span>내 점수: {submissionResult ? submissionResult.total_score : '확인 중'}점</span>
          </div>
        </div>

        {/* 1. Timer or Answer Result Indicator */}
        {isQuestionActive ? (
          <TimerBar secondsLeft={secondsLeft} timeLimit={limit} />
        ) : (
          <div 
            style={{ 
              margin: '16px 0', 
              padding: '12px 18px', 
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: 'var(--color-navy)',
              color: 'white',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            선생님이 정답과 해설을 공개했습니다!
          </div>
        )}

        {/* 2. Question Details Card */}
        <QuizCard 
          questionNumber={questionIndex + 1}
          totalQuestions={6}
          level={currentQuestion.level}
          questionText={currentQuestion.question_text}
          type={currentQuestion.type}
        />

        {/* 3. Choices Section */}
        <div className="choices-grid">
          {currentQuestion.choices.map((choice) => {
            let isChoiceCorrect = false;
            let isChoiceIncorrect = false;

            if (isRevealed) {
              isChoiceCorrect = choice.choice_number === revealedData.correctAnswer;
              isChoiceIncorrect = hasSubmitted && 
                                  selectedChoice === choice.choice_number && 
                                  choice.choice_number !== revealedData.correctAnswer;
            }

            return (
              <ChoiceButton 
                key={choice.choice_number}
                choiceNumber={choice.choice_number}
                choiceText={choice.choice_text}
                isSelected={selectedChoice === choice.choice_number}
                isCorrect={isChoiceCorrect}
                isIncorrect={isChoiceIncorrect}
                disabled={hasSubmitted || isRevealed || submitting}
                onClick={() => handleSelect(choice.choice_number)}
              />
            );
          })}
        </div>

        {/* 4. Action buttons */}
        {isQuestionActive && !hasSubmitted && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary btn-large" 
              onClick={() => handleSubmit(false)}
              disabled={selectedChoice === null || submitting}
            >
              정답 제출하기 🚀
            </button>
          </div>
        )}

        {/* 5. Submitted answer details - shown while waiting for teacher reveal */}
        {isQuestionActive && hasSubmitted && (
          <div 
            className="card animate-pop" 
            style={{ 
              marginTop: '24px', 
              textAlign: 'center', 
              border: '3px dashed var(--color-primary)',
              background: 'rgba(74, 144, 226, 0.02)'
            }}
          >
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '8px' }}>
              답안 제출 완료!
            </h4>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              내가 낸 답: <strong>{selectedChoice}번</strong>
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
              선생님이 정답을 공개할 때까지 잠시 기다려 주세요... ⏳
            </p>
          </div>
        )}

        {/* 6. Explanation screen - shown on reveal */}
        {isRevealed && submissionResult && (
          <div 
            className="card animate-pop" 
            style={{ 
              marginTop: '24px', 
              border: `4px solid ${submissionResult.is_correct ? 'var(--color-green)' : 'var(--color-red)'}`,
              background: submissionResult.is_correct ? 'rgba(46, 204, 113, 0.02)' : 'rgba(231, 76, 60, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              {submissionResult.is_correct ? (
                <>
                  <div style={{ backgroundColor: 'var(--color-green)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 color="white" size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e7e34' }}>정답입니다! 🥳</h3>
                    <p style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                      +{submissionResult.score_added}점 획득! 
                      {submissionResult.streak_count >= 3 && <span style={{ color: 'var(--color-purple)' }}> (연속 정답 보너스 포함!)</span>}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ backgroundColor: 'var(--color-red)', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle color="white" size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#bd2130' }}>아쉬워요! 😢</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      정답은 <strong>{revealedData.correctAnswer}번</strong>입니다.
                    </p>
                  </div>
                </>
              )}
            </div>

            {submissionResult.streak_count > 1 && (
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  backgroundColor: 'rgba(155, 89, 182, 0.1)', 
                  color: 'var(--color-purple)', 
                  padding: '4px 12px', 
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}
              >
                <Zap size={14} fill="var(--color-purple)" />
                <span>{submissionResult.streak_count}문제 연속 정답 중!</span>
              </div>
            )}

            {/* Explanation box */}
            <div style={{ borderTop: '2px solid #edf2f7', paddingTop: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>관용어 뜻</span>
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-navy)', marginTop: '2px' }}>
                  {revealedData.explanation}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>예문 활용</span>
                <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '2px', fontStyle: 'italic', background: '#f7fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #cbd5e0' }}>
                  "{revealedData.exampleSentence}"
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>
              교사가 다음 문제로 넘어가면 화면이 자동으로 전환됩니다. ⏳
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
