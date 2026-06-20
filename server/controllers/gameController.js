const db = require('../config/db');

// Helper to generate random game code (6 characters, alphanumeric)
function generateGameCode() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. POST /api/games - Create new game room
exports.createGame = async (req, res) => {
  const { title, team_count } = req.body;
  const teamCount = parseInt(team_count) || 2;
  const question_set_id = 1; // Default question set
  const teacher_id = 1; // Default teacher

  if (!title) {
    return res.status(400).json({ error: '게임 제목을 입력해주세요.' });
  }

  try {
    let gameCode;
    let codeExists = true;

    // Generate unique game code
    while (codeExists) {
      gameCode = generateGameCode();
      const existing = await db.getRow("SELECT game_id FROM games WHERE game_code = ? AND status != 'FINISHED'", [gameCode]);
      if (!existing) {
        codeExists = false;
      }
    }

    // Insert game
    await db.runQuery(
      `INSERT INTO games (teacher_id, title, game_code, status, question_set_id, current_question_index)
       VALUES (?, ?, ?, 'WAITING', ?, -1)`,
      [teacher_id, title, gameCode, question_set_id]
    );

    const lastGame = await db.getRow("SELECT last_insert_rowid() as id");
    const game_id = lastGame.id;

    // Insert teams
    const teamConfigs = [
      { name: '청룡팀 (청색)', color: '#4A90E2' },
      { name: '백호팀 (백색)', color: '#8E44AD' },
      { name: '주작팀 (적색)', color: '#E74C3C' },
      { name: '현무팀 (녹색)', color: '#2ECC71' }
    ];

    for (let i = 0; i < teamCount; i++) {
      const config = teamConfigs[i % teamConfigs.length];
      await db.runQuery(
        "INSERT INTO teams (game_id, team_name, team_color, score) VALUES (?, ?, ?, 0)",
        [game_id, config.name, config.color]
      );
    }

    res.status(201).json({
      game_id,
      title,
      game_code: gameCode,
      status: 'WAITING',
      team_count: teamCount
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: '게임방 생성에 실패했습니다.' });
  }
};

// 2. POST /api/games/join - Join game room
exports.joinGame = async (req, res) => {
  const { game_code, nickname } = req.body;

  if (!game_code || !nickname) {
    return res.status(400).json({ error: '참여 코드와 닉네임을 입력해주세요.' });
  }

  const cleanCode = game_code.trim().toUpperCase();
  const cleanNickname = nickname.trim();

  try {
    // Check if game exists and is WAITING
    const game = await db.getRow("SELECT * FROM games WHERE game_code = ? AND status = 'WAITING'", [cleanCode]);
    if (!game) {
      return res.status(404).json({ error: '대기 중인 게임방을 찾을 수 없습니다. 코드를 확인해주세요.' });
    }

    // Check duplicate nickname in this game
    const duplicate = await db.getRow("SELECT student_id FROM students WHERE game_id = ? AND nickname = ?", [game.game_id, cleanNickname]);
    if (duplicate) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.' });
    }

    // Fetch teams
    const teams = await db.getAllRows("SELECT * FROM teams WHERE game_id = ?", [game.game_id]);
    if (teams.length === 0) {
      return res.status(500).json({ error: '팀이 존재하지 않는 게임방입니다.' });
    }

    // Auto balance: Assign to team with fewest students
    const teamCounts = [];
    for (const team of teams) {
      const countRow = await db.getRow("SELECT COUNT(*) as count FROM students WHERE team_id = ?", [team.team_id]);
      teamCounts.push({ team_id: team.team_id, count: countRow.count });
    }
    // Sort ascending by student count
    teamCounts.sort((a, b) => a.count - b.count);
    const assignedTeamId = teamCounts[0].team_id;
    const assignedTeam = teams.find(t => t.team_id === assignedTeamId);

    // Insert student
    await db.runQuery(
      `INSERT INTO students (game_id, nickname, team_id, score, correct_count, streak_count)
       VALUES (?, ?, ?, 0, 0, 0)`,
      [game.game_id, cleanNickname, assignedTeamId]
    );

    const lastStudent = await db.getRow("SELECT last_insert_rowid() as id");
    const student_id = lastStudent.id;

    // Trigger Socket.io real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(cleanCode).emit('student_joined', {
        student_id,
        nickname: cleanNickname,
        team_name: assignedTeam.team_name,
        team_color: assignedTeam.team_color
      });
    }

    res.json({
      student_id,
      game_id: game.game_id,
      nickname: cleanNickname,
      team_id: assignedTeamId,
      team_name: assignedTeam.team_name,
      team_color: assignedTeam.team_color,
      game_code: cleanCode
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: '게임방 입장에 실패했습니다.' });
  }
};

// 3. GET /api/games/:gameId - Get game room status and members
exports.getGameDetails = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) {
      return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });
    }

    const teams = await db.getAllRows("SELECT * FROM teams WHERE game_id = ?", [gameId]);
    const students = await db.getAllRows(`
      SELECT s.*, t.team_name, t.team_color 
      FROM students s
      LEFT JOIN teams t ON s.team_id = t.team_id
      WHERE s.game_id = ?
      ORDER BY s.created_at ASC
    `, [gameId]);

    // Count how many questions in set
    const qCountRow = await db.getRow("SELECT COUNT(*) as count FROM questions WHERE question_set_id = ?", [game.question_set_id]);

    res.json({
      game,
      teams,
      students,
      total_questions: qCountRow.count
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: '게임방 정보를 가져오는데 실패했습니다.' });
  }
};

// 4. POST /api/games/:gameId/start - Start game (by teacher)
exports.startGame = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) {
      return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });
    }

    if (game.status !== 'WAITING') {
      return res.status(400).json({ error: '이미 진행 중이거나 종료된 게임입니다.' });
    }

    // Set first question
    await db.runQuery("UPDATE games SET status = 'PLAYING', current_question_index = 0 WHERE game_id = ?", [gameId]);

    // Fetch the first question details
    const firstQ = await db.getRow(`
      SELECT question_id, idiom, type, level, question_text, time_limit
      FROM questions 
      WHERE question_set_id = ? 
      ORDER BY question_id ASC 
      LIMIT 1
    `, [game.question_set_id]);

    if (!firstQ) {
      return res.status(400).json({ error: '게임에 연결된 문제가 없습니다.' });
    }

    const choices = await db.getAllRows("SELECT choice_number, choice_text FROM choices WHERE question_id = ? ORDER BY choice_number ASC", [firstQ.question_id]);
    firstQ.choices = choices;

    // Send via socket
    const io = req.app.get('io');
    if (io) {
      io.to(game.game_code).emit('game_started', {
        question: firstQ,
        questionIndex: 0
      });
    }

    res.json({ message: '게임이 시작되었습니다.', question: firstQ });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: '게임 시작에 실패했습니다.' });
  }
};

// 5. GET /api/games/:gameId/questions/current - Get current question for student
exports.getCurrentQuestion = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) {
      return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });
    }

    if (game.status !== 'PLAYING') {
      return res.status(400).json({ error: '게임이 시작되지 않았거나 이미 종료되었습니다.' });
    }

    const question = await db.getRow(`
      SELECT question_id, idiom, type, level, question_text, time_limit
      FROM questions 
      WHERE question_set_id = ? 
      ORDER BY question_id ASC 
      LIMIT 1 OFFSET ?
    `, [game.question_set_id, game.current_question_index]);

    if (!question) {
      return res.status(404).json({ error: '현재 문제를 불러올 수 없습니다.' });
    }

    // Load choices (exclude is_correct to prevent cheats)
    const choices = await db.getAllRows("SELECT choice_number, choice_text FROM choices WHERE question_id = ? ORDER BY choice_number ASC", [question.question_id]);
    question.choices = choices;

    res.json(question);
  } catch (error) {
    console.error('Error fetching current question:', error);
    res.status(500).json({ error: '문제를 불러오는데 실패했습니다.' });
  }
};

// 6. POST /api/answers - Submit student answer
exports.submitAnswer = async (req, res) => {
  const { student_id, game_id, question_id, selected_choice, response_time } = req.body;

  if (!student_id || !game_id || !question_id || selected_choice === undefined || response_time === undefined) {
    return res.status(400).json({ error: '필수 제출 데이터가 누락되었습니다.' });
  }

  try {
    // 1. Fetch game code
    const game = await db.getRow("SELECT game_code FROM games WHERE game_id = ?", [game_id]);
    if (!game) return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });

    // Check if duplicate submission
    const existing = await db.getRow("SELECT answer_id FROM answers WHERE student_id = ? AND question_id = ?", [student_id, question_id]);
    if (existing) {
      return res.status(400).json({ error: '이미 답안을 제출하였습니다.' });
    }

    // 2. Fetch question details
    const question = await db.getRow("SELECT * FROM questions WHERE question_id = ?", [question_id]);
    if (!question) return res.status(404).json({ error: '문제를 찾을 수 없습니다.' });

    const isCorrect = (parseInt(selected_choice) === question.correct_answer) ? 1 : 0;
    let scoreAdded = 0;

    const student = await db.getRow("SELECT * FROM students WHERE student_id = ?", [student_id]);
    if (!student) return res.status(404).json({ error: '학생 정보를 찾을 수 없습니다.' });

    let newStreak = student.streak_count;

    if (isCorrect) {
      // 1. Base Score by Level
      if (question.level === 'EASY') scoreAdded = 100;
      else if (question.level === 'NORMAL') scoreAdded = 150;
      else if (question.level === 'HARD') scoreAdded = 200;

      // 2. Speed Bonus
      if (response_time <= 10) {
        scoreAdded += 30;
      } else if (response_time <= 20) {
        scoreAdded += 10;
      }

      // 3. Streak Bonus
      newStreak += 1;
      if (newStreak % 3 === 0 && newStreak > 0) {
        scoreAdded += 50;
      }
    } else {
      newStreak = 0;
    }

    const newScore = student.score + scoreAdded;
    const newCorrectCount = student.correct_count + (isCorrect ? 1 : 0);

    // Update student score, streak, correct count
    await db.runQuery(
      `UPDATE students 
       SET score = ?, correct_count = ?, streak_count = ? 
       WHERE student_id = ?`,
      [newScore, newCorrectCount, newStreak, student_id]
    );

    // Update team score
    if (scoreAdded > 0) {
      await db.runQuery(
        `UPDATE teams 
         SET score = score + ? 
         WHERE team_id = ?`,
        [scoreAdded, student.team_id]
      );
    }

    // Log answer
    await db.runQuery(
      `INSERT INTO answers (game_id, student_id, question_id, selected_choice, is_correct, response_time, score_added)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [game_id, student_id, question_id, selected_choice, isCorrect, response_time, scoreAdded]
    );

    // Count submissions to notify teacher
    const submitCountRow = await db.getRow("SELECT COUNT(*) as count FROM answers WHERE game_id = ? AND question_id = ?", [game_id, question_id]);
    const totalStudentsRow = await db.getRow("SELECT COUNT(*) as count FROM students WHERE game_id = ?", [game_id]);

    // Broadcast to teacher via socket
    const io = req.app.get('io');
    if (io) {
      io.to(game.game_code).emit('student_submitted', {
        submittedCount: submitCountRow.count,
        totalStudents: totalStudentsRow.count
      });
    }

    res.json({
      is_correct: isCorrect === 1,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      example_sentence: question.example_sentence,
      score_added: scoreAdded,
      total_score: newScore,
      streak_count: newStreak
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: '답안 제출에 실패했습니다.' });
  }
};

// 7. POST /api/games/:gameId/reveal - Reveal current question explanation (by teacher)
exports.revealAnswer = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });

    // Fetch details of the current question
    const question = await db.getRow(`
      SELECT question_id, correct_answer, explanation, example_sentence
      FROM questions 
      WHERE question_set_id = ? 
      ORDER BY question_id ASC 
      LIMIT 1 OFFSET ?
    `, [game.question_set_id, game.current_question_index]);

    if (!question) {
      return res.status(404).json({ error: '현재 문제를 불러올 수 없습니다.' });
    }

    // Broadcast reveal event to everyone
    const io = req.app.get('io');
    if (io) {
      io.to(game.game_code).emit('reveal_answer', {
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        exampleSentence: question.example_sentence
      });
    }

    res.json({ message: '정답이 공개되었습니다.' });
  } catch (error) {
    console.error('Error revealing answer:', error);
    res.status(500).json({ error: '정답 공개에 실패했습니다.' });
  }
};

// 8. POST /api/games/:gameId/next - Move to next question
exports.nextQuestion = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });

    // Get total questions count
    const qCountRow = await db.getRow("SELECT COUNT(*) as count FROM questions WHERE question_set_id = ?", [game.question_set_id]);
    const nextIndex = game.current_question_index + 1;

    if (nextIndex >= qCountRow.count) {
      return res.status(400).json({ error: '더 이상 문제가 없습니다. 게임을 종료해주세요.' });
    }

    // Update database index
    await db.runQuery("UPDATE games SET current_question_index = ? WHERE game_id = ?", [nextIndex, gameId]);

    // Fetch next question details
    const question = await db.getRow(`
      SELECT question_id, idiom, type, level, question_text, time_limit
      FROM questions 
      WHERE question_set_id = ? 
      ORDER BY question_id ASC 
      LIMIT 1 OFFSET ?
    `, [game.question_set_id, nextIndex]);

    const choices = await db.getAllRows("SELECT choice_number, choice_text FROM choices WHERE question_id = ? ORDER BY choice_number ASC", [question.question_id]);
    question.choices = choices;

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.to(game.game_code).emit('new_question', {
        question,
        questionIndex: nextIndex
      });
    }

    res.json({ message: '다음 문제로 이동했습니다.', question, questionIndex: nextIndex });
  } catch (error) {
    console.error('Error moving to next question:', error);
    res.status(500).json({ error: '다음 문제 이동에 실패했습니다.' });
  }
};

// 9. GET /api/games/:gameId/scoreboard - Get current scoreboard (realtime)
exports.getScoreboard = async (req, res) => {
  const { gameId } = req.params;

  try {
    // 1. Teams scoreboard sorted by score DESC
    const teams = await db.getAllRows("SELECT * FROM teams WHERE game_id = ? ORDER BY score DESC", [gameId]);

    // 2. Students ranking
    const students = await db.getAllRows(`
      SELECT s.*, t.team_name, t.team_color 
      FROM students s
      LEFT JOIN teams t ON s.team_id = t.team_id
      WHERE s.game_id = ? 
      ORDER BY s.score DESC, s.correct_count DESC
    `, [gameId]);

    res.json({ teams, students });
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    res.status(500).json({ error: '점수판을 가져오는데 실패했습니다.' });
  }
};

// 10. POST /api/games/:gameId/finish - Finish game and compute results
exports.finishGame = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await db.getRow("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (!game) return res.status(404).json({ error: '게임방을 찾을 수 없습니다.' });

    if (game.status === 'FINISHED') {
      return res.json({ message: '이미 종료된 게임입니다.' });
    }

    // 1. Find winner team
    const topTeam = await db.getRow("SELECT team_id FROM teams WHERE game_id = ? ORDER BY score DESC LIMIT 1", [gameId]);
    const winner_team_id = topTeam ? topTeam.team_id : null;

    // 2. Calculate average score of students
    const avgScoreRow = await db.getRow("SELECT AVG(score) as avgScore FROM students WHERE game_id = ?", [gameId]);
    const average_score = avgScoreRow.avgScore || 0;

    // 3. Count total questions in set
    const totalQRow = await db.getRow("SELECT COUNT(*) as count FROM questions WHERE question_set_id = ?", [game.question_set_id]);
    const total_questions = totalQRow.count;

    // 4. Find difficult questions (lowest correct rates)
    // Query answers to find percentage of correct answers per question
    const questionStats = await db.getAllRows(`
      SELECT q.question_id, q.idiom, 
             SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_cnt,
             COUNT(a.answer_id) as total_cnt
      FROM questions q
      JOIN answers a ON q.question_id = a.question_id
      WHERE a.game_id = ?
      GROUP BY q.question_id
    `, [gameId]);

    const difficultQuestions = [];
    for (const stat of questionStats) {
      const correctRate = stat.total_cnt > 0 ? (stat.correct_cnt / stat.total_cnt) * 100 : 100;
      if (correctRate < 60) { // If correct rate is below 60%
        difficultQuestions.push({
          question_id: stat.question_id,
          idiom: stat.idiom,
          correct_rate: parseFloat(correctRate.toFixed(1))
        });
      }
    }

    // Update game status
    await db.runQuery(
      "UPDATE games SET status = 'FINISHED', finished_at = CURRENT_TIMESTAMP WHERE game_id = ?",
      [gameId]
    );

    // Save into game_results
    await db.runQuery(
      `INSERT INTO game_results (game_id, winner_team_id, total_questions, average_score, difficult_questions)
       VALUES (?, ?, ?, ?, ?)`,
      [gameId, winner_team_id, total_questions, average_score, JSON.stringify(difficultQuestions)]
    );

    // Broadcast to students
    const io = req.app.get('io');
    if (io) {
      io.to(game.game_code).emit('game_finished');
    }

    res.json({ message: '게임이 종료되었습니다.', winner_team_id });
  } catch (error) {
    console.error('Error finishing game:', error);
    res.status(500).json({ error: '게임 종료 처리에 실패했습니다.' });
  }
};

// 11. GET /api/games/:gameId/result - Get final results
exports.getGameResult = async (req, res) => {
  const { gameId } = req.params;

  try {
    const result = await db.getRow("SELECT * FROM game_results WHERE game_id = ?", [gameId]);
    if (!result) {
      return res.status(404).json({ error: '최종 결과가 등록되지 않았습니다.' });
    }

    const winnerTeam = await db.getRow("SELECT * FROM teams WHERE team_id = ?", [result.winner_team_id]);
    const teams = await db.getAllRows("SELECT * FROM teams WHERE game_id = ? ORDER BY score DESC", [gameId]);
    const students = await db.getAllRows(`
      SELECT s.student_id, s.nickname, s.score, s.correct_count, t.team_name, t.team_color
      FROM students s
      LEFT JOIN teams t ON s.team_id = t.team_id
      WHERE s.game_id = ?
      ORDER BY s.score DESC
    `, [gameId]);

    // Question analytics
    const questionsList = await db.getAllRows(`
      SELECT q.question_id, q.idiom, q.question_text, q.explanation, q.example_sentence, q.level
      FROM questions q
      WHERE q.question_set_id = (SELECT question_set_id FROM games WHERE game_id = ?)
    `, [gameId]);

    const analytics = [];
    for (let q of questionsList) {
      const stats = await db.getRow(`
        SELECT COUNT(answer_id) as total_answers,
               SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
        FROM answers
        WHERE game_id = ? AND question_id = ?
      `, [gameId, q.question_id]);

      const total = stats.total_answers || 0;
      const correct = stats.correct_answers || 0;
      const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

      analytics.push({
        ...q,
        total_answers: total,
        correct_answers: correct,
        correct_rate: rate
      });
    }

    res.json({
      result_id: result.result_id,
      game_id: result.game_id,
      winner_team: winnerTeam,
      average_score: result.average_score,
      total_questions: result.total_questions,
      teams,
      students,
      difficult_questions: JSON.parse(result.difficult_questions || '[]'),
      question_analytics: analytics
    });
  } catch (error) {
    console.error('Error fetching final result:', error);
    res.status(500).json({ error: '최종 결과를 가져오는데 실패했습니다.' });
  }
};
