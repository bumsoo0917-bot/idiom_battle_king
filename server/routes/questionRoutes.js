const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.get('/', questionController.getQuestions);
router.post('/', questionController.createQuestion);
router.put('/:questionId', questionController.updateQuestion);
router.delete('/:questionId', questionController.deleteQuestion);

module.exports = router;
