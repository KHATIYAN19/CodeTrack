const Question = require('../Model/Question');
const Topic = require('../Model/Topic');
exports.getTopics = async (req, res, next) => {
    try {
        const topics = await Topic.find().sort({ name: 1 }); 
        res.status(200).json({
            success: true,
            count: topics.length,
            data: topics
        });
    } catch (err) {
        console.error('Error fetching topics:', err);
        res.status(500).json({ success: false, error: 'Server Error fetching topics' });
    }
};

const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase()
        .split(' ') 
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '); 
};

exports.addTopic = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Please provide a topic name' });
        }
        const trimmedName = name.trim();
        const formattedName = capitalizeWords(trimmedName);
        const existingTopic = await Topic.findOne({
             name: new RegExp('^' + formattedName + '$', 'i')
        });
        if (existingTopic) {
            return res.status(400).json({
                success: false,
                error: `Topic '${trimmedName}' already exists as '${existingTopic.name}'.`
            });
        }
        const newTopic = await Topic.create({ name: formattedName });
        res.status(201).json({
            success: true,
            data: newTopic
        });

    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0] || 'field';
            const attemptedValue = req.body.name ? req.body.name.trim() : 'provided value';
            return res.status(400).json({
                 success: false,
                 error: `Failed to add topic '${attemptedValue}'. A database constraint prevents duplication on ${field}.`
            });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        console.error("Server Error adding topic:", err); 
        res.status(500).json({ success: false, error: 'Server Error adding topic' });
    }
};


exports.editTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Please provide a new topic name' });
        }
        const trimmedName = name.trim();
        const formattedName = capitalizeWords(trimmedName);
        const topicToEdit = await Topic.findById(id);
        if (!topicToEdit) {
            return res.status(404).json({ success: false, error: `Topic not found with id ${id}` });
        }
        const existingTopicWithNewName = await Topic.findOne({
             name: new RegExp('^' + formattedName + '$', 'i'),
             _id: { $ne: id } 
        });
        if (existingTopicWithNewName) {
            return res.status(400).json({
                success: false,
                error: `Another topic named '${existingTopicWithNewName.name}' already exists.`
            });
        }

        topicToEdit.name = formattedName;
        const updatedTopic = await topicToEdit.save();

        res.status(200).json({
            success: true,
            data: updatedTopic
        });

    } catch (err) {
         if (err.name === 'CastError' && err.kind === 'ObjectId') {
             return res.status(400).json({ success: false, error: `Invalid topic ID format: ${req.params.id}` });
         }
         if (err.code === 11000) {
             const field = Object.keys(err.keyValue)[0] || 'field';
             const attemptedValue = req.body.name ? req.body.name.trim() : 'provided value';
             return res.status(400).json({
                 success: false,
                 error: `Failed to update topic to '${attemptedValue}'. A database constraint prevents duplication on ${field}.`
             });
         }
         if (err.name === 'ValidationError') {
             const messages = Object.values(err.errors).map(val => val.message);
             return res.status(400).json({ success: false, error: messages.join(', ') });
         }
         console.error("Server Error editing topic:", err);
         res.status(500).json({ success: false, error: 'Server Error editing topic' });
    }
};
exports.deleteTopic = async (req, res, next) => {
    try {
        const topicId = req.params.id;
        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ success: false, error: `Topic not found with id of ${topicId}` });
        }
        const questionsExist = await Question.findOne({ topic: topic.name });

        if (questionsExist) {
            return res.status(400).json({ success: false, error: `Cannot delete topic '${topic.name}' because questions are associated with it. Please delete or reassign the questions first.` });
        }
        await Topic.findByIdAndDelete(topicId);

        res.status(200).json({
            success: true,
            data: {},
            message: `Topic '${topic.name}' deleted successfully.`
        });

    } catch (err) {
        console.error('Error deleting topic:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: `Invalid Topic ID format: ${req.params.id}` });
        }
        res.status(500).json({ success: false, error: 'Server Error deleting topic' });
    }
};
