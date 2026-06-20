const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) console.error('Pragma foreign keys error:', pragmaErr);
    });
  }
});

// Helper function to run DB queries as promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper function to get single row
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper function to get all rows
const getAllRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database schema and seed default data
const initDatabase = async () => {
  try {
    // 1. Create Teachers Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS teachers (
        teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Question Sets Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS question_sets (
        question_set_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        grade INTEGER DEFAULT 6,
        description TEXT,
        created_by INTEGER,
        FOREIGN KEY(created_by) REFERENCES teachers(teacher_id)
      )
    `);

    // 3. Create Games Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        game_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'WAITING', -- WAITING, PLAYING, FINISHED
        question_set_id INTEGER NOT NULL,
        current_question_index INTEGER DEFAULT -1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        finished_at DATETIME,
        FOREIGN KEY(teacher_id) REFERENCES teachers(teacher_id),
        FOREIGN KEY(question_set_id) REFERENCES question_sets(question_set_id)
      )
    `);

    // 4. Create Teams Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        team_name TEXT NOT NULL,
        team_color TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        FOREIGN KEY(game_id) REFERENCES games(game_id) ON DELETE CASCADE
      )
    `);

    // 5. Create Students Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        nickname TEXT NOT NULL,
        team_id INTEGER,
        score INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        streak_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(game_id) REFERENCES games(game_id) ON DELETE CASCADE,
        FOREIGN KEY(team_id) REFERENCES teams(team_id) ON DELETE SET NULL,
        UNIQUE(game_id, nickname)
      )
    `);

    // 6. Create Questions Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS questions (
        question_id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_set_id INTEGER NOT NULL,
        idiom TEXT NOT NULL,
        type TEXT NOT NULL, -- MEANING, SITUATION, CONTEXT, OX
        level TEXT NOT NULL, -- EASY, NORMAL, HARD
        question_text TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        example_sentence TEXT NOT NULL,
        time_limit INTEGER DEFAULT 30,
        FOREIGN KEY(question_set_id) REFERENCES question_sets(question_set_id) ON DELETE CASCADE
      )
    `);

    // 7. Create Choices Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS choices (
        choice_id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        choice_number INTEGER NOT NULL,
        choice_text TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        FOREIGN KEY(question_id) REFERENCES questions(question_id) ON DELETE CASCADE
      )
    `);

    // 8. Create Answers Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS answers (
        answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_choice INTEGER NOT NULL,
        is_correct INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        score_added INTEGER NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(game_id) REFERENCES games(game_id),
        FOREIGN KEY(student_id) REFERENCES students(student_id) ON DELETE CASCADE,
        FOREIGN KEY(question_id) REFERENCES questions(question_id)
      )
    `);

    // 9. Create Game Results Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS game_results (
        result_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        winner_team_id INTEGER,
        total_questions INTEGER NOT NULL,
        average_score REAL NOT NULL,
        difficult_questions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(game_id) REFERENCES games(game_id) ON DELETE CASCADE,
        FOREIGN KEY(winner_team_id) REFERENCES teams(team_id)
      )
    `);

    console.log('Database tables verified/created successfully.');

    // --- Seeding Default Data ---
    // Check if default teacher exists
    let teacher = await getRow("SELECT * FROM teachers WHERE email = ?", ['teacher@school.kr']);
    if (!teacher) {
      await runQuery(
        "INSERT INTO teachers (name, email, password_hash) VALUES (?, ?, ?)",
        ['김교사', 'teacher@school.kr', 'pbkdf2_hashed_or_plain']
      );
      teacher = await getRow("SELECT * FROM teachers WHERE email = ?", ['teacher@school.kr']);
      console.log('Default teacher seeded.');
    }

    // Check if default question set exists
    let qSet = await getRow("SELECT * FROM question_sets WHERE created_by = ?", [teacher.teacher_id]);
    if (!qSet) {
      await runQuery(
        "INSERT INTO question_sets (title, grade, description, created_by) VALUES (?, ?, ?, ?)",
        ['6학년 관용어 대결왕 기본 세트', 6, '초등학교 6학년 필수 관용어 퀴즈 세트', teacher.teacher_id]
      );
      qSet = await getRow("SELECT * FROM question_sets WHERE created_by = ?", [teacher.teacher_id]);
      console.log('Default question set seeded.');

      // Seed Questions & Choices
      const defaultQuestions = [
        {
          idiom: '귀가 얇다',
          type: 'MEANING',
          level: 'EASY',
          question_text: '“귀가 얇다”의 뜻으로 알맞은 것은?',
          correct_answer: 2,
          explanation: '“귀가 얇다”는 남의 말을 쉽게 믿거나 쉽게 흔들린다는 뜻이다.',
          example_sentence: '민수는 귀가 얇아서 친구 말만 듣고 계획을 자주 바꾼다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '귀가 작다', isCorrect: 0 },
            { num: 2, text: '남의 말을 쉽게 믿거나 흔들린다', isCorrect: 1 },
            { num: 3, text: '소리를 잘 듣는다', isCorrect: 0 },
            { num: 4, text: '말을 하지 않는다', isCorrect: 0 }
          ]
        },
        {
          idiom: '입이 무겁다',
          type: 'SITUATION',
          level: 'EASY',
          question_text: '“입이 무겁다”가 어울리는 상황은?',
          correct_answer: 1,
          explanation: '“입이 무겁다”는 말을 함부로 하지 않고 비밀을 잘 지킨다는 뜻이다.',
          example_sentence: '지우는 입이 무거워서 친구들이 비밀 이야기를 믿고 한다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '비밀을 잘 지키는 친구', isCorrect: 1 },
            { num: 2, text: '말을 너무 많이 하는 친구', isCorrect: 0 },
            { num: 3, text: '밥을 천천히 먹는 친구', isCorrect: 0 },
            { num: 4, text: '노래를 잘 부르는 친구', isCorrect: 0 }
          ]
        },
        {
          idiom: '발이 넓다',
          type: 'MEANING',
          level: 'EASY',
          question_text: '“발이 넓다”의 뜻으로 알맞은 것은?',
          correct_answer: 2,
          explanation: '“발이 넓다”는 아는 사람이 많고 여러 곳에 관계가 있다는 뜻이다.',
          example_sentence: '우리 반 회장은 발이 넓어서 다른 반 친구들도 많이 알고 있다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '발 크기가 크다', isCorrect: 0 },
            { num: 2, text: '아는 사람이 많고 활동 범위가 넓다', isCorrect: 1 },
            { num: 3, text: '운동을 잘한다', isCorrect: 0 },
            { num: 4, text: '길을 잘 찾는다', isCorrect: 0 }
          ]
        },
        {
          idiom: '손에 땀을 쥐다',
          type: 'CONTEXT',
          level: 'NORMAL',
          question_text: '축구 결승전에서 마지막 승부차기를 보는 순간 모두가 긴장했다. 이 상황에 어울리는 관용어는?',
          correct_answer: 1,
          explanation: '“손에 땀을 쥐다”는 매우 긴장되거나 아슬아슬하다는 뜻이다.',
          example_sentence: '마지막 장면이 너무 아슬아슬해서 손에 땀을 쥐고 보았다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '손에 땀을 쥐다', isCorrect: 1 },
            { num: 2, text: '눈이 높다', isCorrect: 0 },
            { num: 3, text: '귀가 얇다', isCorrect: 0 },
            { num: 4, text: '코가 높다', isCorrect: 0 }
          ]
        },
        {
          idiom: '발등에 불이 떨어지다',
          type: 'MEANING',
          level: 'HARD',
          question_text: '“발등에 불이 떨어지다”의 뜻으로 알맞은 것은?',
          correct_answer: 2,
          explanation: '“발등에 불이 떨어지다”는 매우 급한 상황이 되었다는 뜻이다.',
          example_sentence: '숙제 마감 시간이 다가오자 발등에 불이 떨어졌다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '발을 다치다', isCorrect: 0 },
            { num: 2, text: '매우 급한 일이 생기다', isCorrect: 1 },
            { num: 3, text: '불장난을 하다', isCorrect: 0 },
            { num: 4, text: '운동을 시작하다', isCorrect: 0 }
          ]
        },
        {
          idiom: '간이 콩알만 해지다',
          type: 'MEANING',
          level: 'HARD',
          question_text: '“간이 콩알만 해지다”의 뜻으로 알맞은 것은?',
          correct_answer: 2,
          explanation: '“간이 콩알만 해지다”는 몹시 무섭거나 겁이 난다는 뜻이다.',
          example_sentence: '갑자기 큰 소리가 나서 간이 콩알만 해졌다.',
          time_limit: 30,
          choices: [
            { num: 1, text: '배가 고프다', isCorrect: 0 },
            { num: 2, text: '몹시 무서워지거나 겁이 나다', isCorrect: 1 },
            { num: 3, text: '건강해지다', isCorrect: 0 },
            { num: 4, text: '기분이 좋아지다', isCorrect: 0 }
          ]
        }
      ];

      for (const q of defaultQuestions) {
        await runQuery(
          `INSERT INTO questions (question_set_id, idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [qSet.question_set_id, q.idiom, q.type, q.level, q.question_text, q.correct_answer, q.explanation, q.example_sentence, q.time_limit]
        );

        // Get the inserted question_id
        const lastQ = await getRow("SELECT last_insert_rowid() as id");
        const qId = lastQ.id;

        for (const choice of q.choices) {
          await runQuery(
            `INSERT INTO choices (question_id, choice_number, choice_text, is_correct)
             VALUES (?, ?, ?, ?)`,
            [qId, choice.num, choice.text, choice.isCorrect]
          );
        }
      }
      console.log('Default questions and choices seeded.');
    }
  } catch (err) {
    console.error('Error during database initialization:', err);
  }
};

module.exports = {
  db,
  runQuery,
  getRow,
  getAllRows,
  initDatabase
};
