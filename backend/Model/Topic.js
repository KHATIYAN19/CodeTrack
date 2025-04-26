
const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a topic name'],
        unique: true,
        trim: true
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Topic', TopicSchema);