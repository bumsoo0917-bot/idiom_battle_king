const db = require('../config/db');

// GET /api/questions - List all questions with choices
exports.getQuestions = async (req, res) => {
  try {
    const questions = await db.getAllRows(`
      SELECT * FROM questions ORDER BY question_id ASC
    `);

    for (let q of questions) {
      q.choices = await db.getAllRows(`
        SELECT * FROM choices WHERE question_id = ? ORDER BY choice_number ASC
      `, [q.question_id]);
    }

    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// POST /api/questions - Create a question with choices
exports.createQuestion = async (req, res) => {
  const { idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit, choices } = req.body;

  if (!idiom || !type || !level || !question_text || !correct_answer || !explanation || !example_sentence || !choices || choices.length === 0) {
    return res.status(400).json({ error: 'Missing required question fields' });
  }

  // default question_set_id = 1
  const question_set_id = 1;

  try {
    // 1. Insert question
    await db.runQuery(`
      INSERT INTO questions (question_set_id, idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [question_set_id, idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit || 30]);

    const lastQ = await db.getRow("SELECT last_insert_rowid() as id");
    const question_id = lastQ.id;

    // 2. Insert choices
    for (const choice of choices) {
      await db.runQuery(`
        INSERT INTO choices (question_id, choice_number, choice_text, is_correct)
        VALUES (?, ?, ?, ?)
      `, [question_id, choice.choice_number, choice.choice_text, choice.choice_number == correct_answer ? 1 : 0]);
    }

    res.status(201).json({ message: 'Question created successfully', question_id });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// PUT /api/questions/:questionId - Update question and choices
exports.updateQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit, choices } = req.body;

  if (!idiom || !type || !level || !question_text || !correct_answer || !explanation || !example_sentence || !choices) {
    return res.status(400).json({ error: 'Missing required fields for update' });
  }

  try {
    // Check if question exists
    const q = await db.getRow("SELECT * FROM questions WHERE question_id = ?", [questionId]);
    if (!q) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 1. Update question
    await db.runQuery(`
      UPDATE questions 
      SET idiom = ?, type = ?, level = ?, question_text = ?, correct_answer = ?, explanation = ?, example_sentence = ?, time_limit = ?
      WHERE question_id = ?
    `, [idiom, type, level, question_text, correct_answer, explanation, example_sentence, time_limit || 30, questionId]);

    // 2. Delete existing choices
    await db.runQuery("DELETE FROM choices WHERE question_id = ?", [questionId]);

    // 3. Insert new choices
    for (const choice of choices) {
      await db.runQuery(`
        INSERT INTO choices (question_id, choice_number, choice_text, is_correct)
        VALUES (?, ?, ?, ?)
      `, [questionId, choice.choice_number, choice.choice_text, choice.choice_number == correct_answer ? 1 : 0]);
    }

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

// DELETE /api/questions/:questionId - Delete question and choices
exports.deleteQuestion = async (req, res) => {
  const { questionId } = req.params;

  try {
    // Check if question exists
    const q = await db.getRow("SELECT * FROM questions WHERE question_id = ?", [questionId]);
    if (!q) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Cascade delete works because of foreign key trigger or direct deletes
    await db.runQuery("DELETE FROM choices WHERE question_id = ?", [questionId]);
    await db.runQuery("DELETE FROM questions WHERE question_id = ?", [questionId]);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};
