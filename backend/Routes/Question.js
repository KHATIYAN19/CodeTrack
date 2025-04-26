const express = require('express');
const {
    getQuestions,
    getQuestionsByTopic,
    addQuestion,
    deleteQuestion,
    toggleQuestionStatus,
    getStats,
    getPagedQuestions
} = require('../Controller/Question');

const router = express.Router();
router
    .route('/')
    .get(getQuestions)
    .post(addQuestion);

router
    .route('/stats')
    .get(getStats);

router
    .route('/topic/:topicName')
    .get(getQuestionsByTopic);

router
    .route('/:id')
    .delete(deleteQuestion);

router
    .route('/:id/toggle')
    .put(toggleQuestionStatus);

router.route('/paged').get(getPagedQuestions); 
module.exports = router;
