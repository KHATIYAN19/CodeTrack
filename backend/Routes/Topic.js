const express = require('express');
const {
    getTopics,
    addTopic,
    deleteTopic,
    editTopic
} = require('../Controller/Topic');

const router = express.Router();

router
    .route('/')
    .get(getTopics)
    .post(addTopic);

router
    .route('/:id')
    .delete(deleteTopic);


router.route("/:id").patch(editTopic);
module.exports = router;
