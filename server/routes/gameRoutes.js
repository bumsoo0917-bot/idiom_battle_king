const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/', gameController.createGame);
router.post('/join', gameController.joinGame);
router.get('/:gameId', gameController.getGameDetails);
router.post('/:gameId/start', gameController.startGame);
router.get('/:gameId/questions/current', gameController.getCurrentQuestion);
router.post('/:gameId/reveal', gameController.revealAnswer);
router.post('/:gameId/next', gameController.nextQuestion);
router.get('/:gameId/scoreboard', gameController.getScoreboard);
router.post('/:gameId/finish', gameController.finishGame);
router.get('/:gameId/result', gameController.getGameResult);

module.exports = router;
