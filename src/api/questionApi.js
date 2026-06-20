import { db } from '../firebase';
import { ref, get, set, update, remove, child } from 'firebase/database';

const DEFAULT_QUESTIONS = [
  {
    question_id: 1,
    idiom: '귀가 얇다',
    type: 'MEANING',
    level: 'EASY',
    question_text: '“귀가 얇다”의 뜻으로 알맞은 것은?',
    correct_answer: 2,
    explanation: '“귀가 얇다”는 남의 말을 쉽게 믿거나 쉽게 흔들린다는 뜻이다.',
    example_sentence: '민수는 귀가 얇아서 친구 말만 듣고 계획을 자주 바꾼다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '귀가 작다' },
      { choice_number: 2, choice_text: '남의 말을 쉽게 믿거나 흔들린다' },
      { choice_number: 3, choice_text: '소리를 잘 듣는다' },
      { choice_number: 4, choice_text: '말을 하지 않는다' }
    ]
  },
  {
    question_id: 2,
    idiom: '입이 무겁다',
    type: 'SITUATION',
    level: 'EASY',
    question_text: '“입이 무겁다”가 어울리는 상황은?',
    correct_answer: 1,
    explanation: '“입이 무겁다”는 말을 함부로 하지 않고 비밀을 잘 지킨다는 뜻이다.',
    example_sentence: '지우는 입이 무거워서 친구들이 비밀 이야기를 믿고 한다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '비밀을 잘 지키는 친구' },
      { choice_number: 2, choice_text: '말을 너무 많이 하는 친구' },
      { choice_number: 3, choice_text: '밥을 천천히 먹는 친구' },
      { choice_number: 4, choice_text: '노래를 잘 부르는 친구' }
    ]
  },
  {
    question_id: 3,
    idiom: '발이 넓다',
    type: 'MEANING',
    level: 'EASY',
    question_text: '“발이 넓다”의 뜻으로 알맞은 것은?',
    correct_answer: 2,
    explanation: '“발이 넓다”는 아는 사람이 많고 여러 곳에 관계가 있다는 뜻이다.',
    example_sentence: '우리 반 회장은 발이 넓어서 다른 반 친구들도 많이 알고 있다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '발 크기가 크다' },
      { choice_number: 2, choice_text: '아는 사람이 많고 활동 범위가 넓다' },
      { choice_number: 3, choice_text: '운동을 잘한다' },
      { choice_number: 4, choice_text: '길을 잘 찾는다' }
    ]
  },
  {
    question_id: 4,
    idiom: '손에 땀을 쥐다',
    type: 'CONTEXT',
    level: 'NORMAL',
    question_text: '축구 결승전에서 마지막 승부차기를 보는 순간 모두가 긴장했다. 이 상황에 어울리는 관용어는?',
    correct_answer: 1,
    explanation: '“손에 땀을 쥐다”는 매우 긴장되거나 아슬아슬하다는 뜻이다.',
    example_sentence: '마지막 장면이 너무 아슬아슬해서 손에 땀을 쥐고 보았다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '손에 땀을 쥐다' },
      { choice_number: 2, choice_text: '눈이 높다' },
      { choice_number: 3, choice_text: '귀가 얇다' },
      { choice_number: 4, choice_text: '코가 높다' }
    ]
  },
  {
    question_id: 5,
    idiom: '발등에 불이 떨어지다',
    type: 'MEANING',
    level: 'HARD',
    question_text: '“발등에 불이 떨어지다”의 뜻으로 알맞은 것은?',
    correct_answer: 2,
    explanation: '“발등에 불이 떨어지다”는 매우 급한 상황이 되었다는 뜻이다.',
    example_sentence: '숙제 마감 시간이 다가오자 발등에 불이 떨어졌다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '발을 다치다' },
      { choice_number: 2, choice_text: '매우 급한 일이 생기다' },
      { choice_number: 3, choice_text: '불장난을 하다' },
      { choice_number: 4, choice_text: '운동을 시작하다' }
    ]
  },
  {
    question_id: 6,
    idiom: '간이 콩알만 해지다',
    type: 'MEANING',
    level: 'HARD',
    question_text: '“간이 콩알만 해지다”의 뜻으로 알맞은 것은?',
    correct_answer: 2,
    explanation: '“간이 콩알만 해지다”는 몹시 무섭거나 겁이 난다는 뜻이다.',
    example_sentence: '갑자기 큰 소리가 나서 간이 콩알만 해졌다.',
    time_limit: 30,
    choices: [
      { choice_number: 1, choice_text: '배가 고프다' },
      { choice_number: 2, choice_text: '몹시 무서워지거나 겁이 나다' },
      { choice_number: 3, choice_text: '건강해지다' },
      { choice_number: 4, choice_text: '기분이 좋아지다' }
    ]
  }
];

export const getQuestions = async () => {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, 'questions'));
  
  if (snapshot.exists()) {
    const val = snapshot.val();
    // Return as array
    return Object.values(val);
  } else {
    // Seed default questions
    console.log('No questions found in RTDB. Seeding default questions...');
    for (const q of DEFAULT_QUESTIONS) {
      await set(ref(db, `questions/${q.question_id}`), q);
    }
    return DEFAULT_QUESTIONS;
  }
};

export const createQuestion = async (questionData) => {
  const allQuestions = await getQuestions();
  // Generate new ID
  const nextId = allQuestions.length > 0 ? Math.max(...allQuestions.map(q => q.question_id)) + 1 : 1;
  const newQuestion = {
    ...questionData,
    question_id: nextId
  };
  await set(ref(db, `questions/${nextId}`), newQuestion);
  return { message: 'Question created successfully', question_id: nextId };
};

export const updateQuestion = async (questionId, questionData) => {
  const qRef = ref(db, `questions/${questionId}`);
  const payload = {
    ...questionData,
    question_id: parseInt(questionId)
  };
  await set(qRef, payload);
  return { message: 'Question updated successfully' };
};

export const deleteQuestion = async (questionId) => {
  const qRef = ref(db, `questions/${questionId}`);
  await remove(qRef);
  return { message: 'Question deleted successfully' };
};
