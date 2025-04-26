
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    topic: { 
        type: String,
        required: [true, 'Please add a topic name'],
        trim: true
    },
    questionName: {
        type: String,
        required: [true, 'Please add the question name/title'],
        trim: true
    },
    platformName: {
        type: String,
        required: [true, 'Please add a platform name'],
        trim: true
    },
    questionNumber:{
        type:Number,
        required:true,
        unique:true
    },
    link: {
        type: String,
        required: [true, 'Please add a link'],
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ],
        unique: true
    },
    difficulty: {
        type: String,
        required: [true, 'Please specify difficulty'],
        enum: ['Easy', 'Medium', 'Hard']
    },
    isDone: {
        type: Boolean,
        default: false
    }
  
}, { timestamps: true }); 

module.exports = mongoose.model('Question', QuestionSchema);