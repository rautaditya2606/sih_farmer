const { Router } = require('express');
const queryController = require('../controllers/queryController');
const feedbackController = require('../controllers/feedbackController');

const router = Router();

router.post('/query', queryController.handleQuery);
router.post('/feedback', feedbackController.recordFeedback);

module.exports = router; 