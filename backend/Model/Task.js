const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    heading: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Date, required: true },
    email: { type: String, required: true },
    beforeReminderSent: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Task', taskSchema);
