const Task = require('../Model/Task');

const sendResponse = (res, success, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success,
        message,
        data
    });
};


const createTask = async (req, res) => {
    try {
        const { heading, content, time, email } = req.body;
        if (!heading || !content || !time) {
            return sendResponse(res, false, 'All fields are required', null, 400);
        }
        const task = new Task({ heading, content, time, email:'lavikhatiyan2@gmail.com' });
        await task.save();
        return sendResponse(res, true, 'Task created successfully', task, 201);
    } catch (error) {
        console.error('Error creating task:', error);
        return sendResponse(res, false, 'Server error while creating task', error, 500);
    }
};


const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ time: 1 });
        return sendResponse(res, true, 'Tasks fetched successfully', tasks, 200);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return sendResponse(res, false, 'Server error while fetching tasks', error, 500);
    }
};


const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { heading, content, time, email } = req.body;
        if (!heading || !content || !time || !email) {
            return sendResponse(res, false, 'All fields (heading, content, time, email) are required to update', null, 400);
        }
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { heading, content, time, email },
            { new: true }
        );
        if (!updatedTask) {
            return sendResponse(res, false, 'Task not found', null, 404);
        }
        return sendResponse(res, true, 'Task updated successfully', updatedTask, 200);
    } catch (error) {
        console.error('Error updating task:', error);
        return sendResponse(res, false, 'Server error while updating task', error, 500);
    }
};


const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            return sendResponse(res, false, 'Task not found', null, 404);
        }
        return sendResponse(res, true, 'Task deleted successfully', null, 200);
    } catch (error) {
        console.error('Error deleting task:', error);
        return sendResponse(res, false, 'Server error while deleting task', error, 500);
    }
};

module.exports = {
    createTask,
    getAllTasks,
    updateTask,
    deleteTask
};
