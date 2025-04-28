const cron = require('node-cron');
const Task = require('../Model/Task');
const sendMail = require('../utils/mailSender');

const startTaskScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const tasks = await Task.find();
            const now = new Date();

            for (const task of tasks) {
                const taskTime = new Date(task.time);
                const diffMs = taskTime.getTime() - now.getTime();
                const diffMinutes = Math.floor(diffMs / 60000);

                // Reminder 10 min before
                if (diffMinutes <= 10 && diffMinutes > 9 && !task.beforeReminderSent) {
                    const htmlContent = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4CAF50;">⏰ Upcoming Task Reminder!</h2>
                            <p>Hey there,</p>
                            <p>Your task <strong style="color: #2196F3;">"${task.heading}"</strong> is scheduled soon!</p>
                            <p><strong>🗓 Task Time:</strong> ${taskTime.toLocaleString()}</p>
                            <p><strong>⏳ Remaining Time:</strong> 10 minutes</p>
                            <p><strong>📝 Task Details:</strong><br>${task.content}</p>
                            <br>
                            <p style="font-size: 14px; color: #777;">This is an automatic reminder from your Task Scheduler 🚀</p>
                        </div>
                    `;

                    await sendMail({
                        to: task.email,
                        subject: `⏰ Reminder: Your Task "${task.heading}" is Coming Up!`,
                        html: htmlContent
                    });

                    task.beforeReminderSent = true;
                    await task.save();
                }

                // Main mail exactly at time
                if (diffMinutes <= 0 && diffMinutes > -1) {
                    const htmlContent = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #F44336;">🚀 Your Task Has Started!</h2>
                            <p>Hey there,</p>
                            <p>Your task <strong style="color: #2196F3;">"${task.heading}"</strong> is starting <strong>NOW</strong>!</p>
                            <p><strong>🗓 Task Time:</strong> ${taskTime.toLocaleString()}</p>
                            <p><strong>📝 Task Details:</strong><br>${task.content}</p>
                            <br>
                            <p style="font-size: 14px; color: #777;">Best of luck! 🔥<br> - Task Scheduler System</p>
                        </div>
                    `;

                    await sendMail({
                        to: task.email,
                        subject: `🚀 Now: Your Task "${task.heading}" Has Started!`,
                        html: htmlContent
                    });

                    await Task.findByIdAndDelete(task._id);
                }
            }
        } catch (error) {
            console.error('Error in task scheduler:', error);
        }
    });
};

module.exports = startTaskScheduler;
