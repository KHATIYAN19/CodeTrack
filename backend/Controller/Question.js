const Question = require('../Model/Question');
const Topic = require('../Model/Topic');
const { URL } = require('url');

const asyncHandler = fn => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (err) {
        console.error(`Error in ${fn.name}:`, err);
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, error: `Invalid ID format: ${err.value}` });
        }
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ success: false, error: `Duplicate field value entered for ${field}: ${err.keyValue[field]}` });
        }
        if (err.name === 'ValidationError') {
           const messages = Object.values(err.errors).map(val => val.message);
           return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.getQuestions = asyncHandler(async (req, res, next) => {
    const searchQuery = req.query.search;
    let findFilter = {};
    if (searchQuery) {
        const isNumeric = /^\d+$/.test(searchQuery);
        if (isNumeric) {
            const searchAsNumber = Number(searchQuery);
            findFilter = { questionNumber: searchAsNumber };
        } else {
            const regex = new RegExp(searchQuery, 'i');
            findFilter = { questionName: regex };
        }
    }
    const questions = await Question.find(findFilter).sort({ questionNumber: 1 });
    const grouped = questions.reduce((acc, question) => {
        const topicName = question.topic || 'Uncategorized';
        if (!acc[topicName]) {
            acc[topicName] = [];
        }
        acc[topicName].push(question);
        return acc;
    }, {});
    const resultsArray = Object.keys(grouped)
        .sort()
        .map(topicName => ({
            topic: topicName,
            questions: grouped[topicName]
        }));
    res.status(200).json({
        success: true,
        count: questions.length,
        data: resultsArray
    });
});


exports.getQuestionsByTopic = asyncHandler(async (req, res, next) => {
    const topicName = req.params.topicName;
    const topicExists = await Topic.findOne({ name: topicName });
    if (!topicExists) {
         return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const questions = await Question.find({ topic: topicName })
                                     .sort({ createdAt: 1 });
    res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
    });
});
const derivePlatformName = (urlString) => {
    try {
       const url = new URL(urlString);
      console.log("enter",urlString)
        let hostname = url.hostname.toLowerCase(); 
      console.log("host",hostname)
        const platformMap = {
            'leetcode.com': 'LeetCode',
            'geeksforgeeks.org': 'GeeksforGeeks',
            'codechef.com': 'CodeChef',
            'hackerrank.com': 'HackerRank',
            'codeforces.com': 'Codeforces',
            'codingninjas.com': 'CodingNinjas',
            'interviewbit.com': 'InterviewBit',
            'atcoder.jp': 'AtCoder',
            'hackerearth.com': 'HackerEarth',
            'topcoder.com': 'TopCoder',
            'www.leetcode.com': 'LeetCode',
            'www.geeksforgeeks.org': 'GeeksforGeeks',
        };
        if (platformMap[hostname]) {
            return platformMap[hostname];
        }
        if (hostname.includes('leetcode.')) return 'LeetCode';
        if (hostname.includes('geeksforgeeks.')) return 'GeeksforGeeks';
        if (hostname.includes('codechef.')) return 'CodeChef';
        if (hostname.includes('hackerrank.')) return 'HackerRank';
        if (hostname.includes('codeforces.')) return 'Codeforces';
        if (hostname.includes('codingninjas.')) return 'CodingNinjas';
        if (hostname.includes('interviewbit.')) return 'InterviewBit';
        if (hostname.includes('atcoder.')) return 'AtCoder';
        if (hostname.includes('hackerearth.')) return 'HackerEarth';
        if (hostname.includes('topcoder.')) return 'TopCoder';
        hostname = hostname.replace(/^www\./, ''); // Remove www. prefix if present
        const parts = hostname.split('.');
        if (parts.length > 0 && parts[0]) {
            const baseName = parts[0];
            return baseName.charAt(0).toUpperCase() + baseName.slice(1);
        }
        return 'Other';

    } catch (error) {
        console.error(`Error parsing URL "${urlString}": ${error.message}`);
        return 'Unknown';
    }
};

exports.addQuestion = asyncHandler(async (req, res, next) => {
    const { topic, questionName, link, difficulty } = req.body;
    if (!topic || !questionName || !link || !difficulty) {
        return res.status(400).json({ success: false, error: 'Please provide all required fields: topic, questionName, link, difficulty' });
    }
    const derivedPlatformName = derivePlatformName(link);
    if (derivedPlatformName === 'Unknown') {
        return res.status(400).json({ success: false, error: 'The provided link is not a valid URL.' });
    }
    const topicExists = await Topic.findOne({ name: topic });
    if (!topicExists) {
        return res.status(400).json({ success: false, error: `Topic '${topic}' does not exist. Please add the topic first or choose an existing one.` });
    }
    const maxQuestion = await Question.findOne().sort({ questionNumber: -1 }).select('questionNumber');
    const newQuestionNumber = maxQuestion ? maxQuestion.questionNumber + 1 : 1;
    const question = await Question.create({
        topic,
        questionName,
        platformName: derivedPlatformName,
        link,
        difficulty,
        questionNumber: newQuestionNumber
    });
    res.status(201).json({
        success: true,
        data: question
    });
});



exports.deleteQuestion = asyncHandler(async (req, res, next) => {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) {
        return res.status(404).json({ success: false, error: `Question not found with id of ${questionId}` });
    }
    await Question.findByIdAndDelete(questionId);
    res.status(200).json({
        success: true,
        data: {},
        message: `Question '${question.questionName}' deleted successfully.`
    });
});

exports.toggleQuestionStatus = asyncHandler(async (req, res, next) => {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) {
        return res.status(404).json({ success: false, error: `Question not found with id of ${questionId}` });
    }
    question.isDone = !question.isDone;
    await question.save();
    res.status(200).json({
        success: true,
        data: question
    });
});

exports.getStats = asyncHandler(async (req, res, next) => {
    // Use $facet to run multiple aggregation pipelines simultaneously
    const results = await Question.aggregate([
       {
           $facet: {
               // Pipeline 1: Calculate counts of SOLVED questions by difficulty
               "solvedStats": [
                   { $match: { isDone: true } }, // Filter for solved questions
                   {
                       $group: {
                           _id: '$difficulty', // Group by difficulty
                           count: { $sum: 1 }   // Count documents in each group
                       }
                   },
                   {
                       $project: { // Reshape the output
                           _id: 0,
                           difficulty: '$_id',
                           count: 1
                       }
                   }
               ],
               // Pipeline 2: Calculate TOTAL counts of questions by difficulty
               "totalStats": [
                   { // No $match stage needed, count all questions
                       $group: {
                           _id: '$difficulty', // Group by difficulty
                           count: { $sum: 1 }   // Count documents in each group
                       }
                   },
                   {
                       $project: { // Reshape the output
                           _id: 0,
                           difficulty: '$_id',
                           count: 1
                       }
                   }
               ],
            
               "overallTotal": [
                   { $count: 'totalCount' } 
               ]
           }
       }
    ]);

    const facetResults = results[0];
    const solvedStats = facetResults.solvedStats || [];
    const totalStats = facetResults.totalStats || [];
    // Get total count, default to 0 if no questions exist
    const totalQuestions = facetResults.overallTotal[0]?.totalCount || 0;

    // --- Process Solved Stats ---
    const totalDone = solvedStats.reduce((sum, stat) => sum + stat.count, 0);
    const easyDone = solvedStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumDone = solvedStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardDone = solvedStats.find(s => s.difficulty === 'Hard')?.count || 0;

    // --- Process Total Stats ---
    const totalEasy = totalStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const totalMedium = totalStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const totalHard = totalStats.find(s => s.difficulty === 'Hard')?.count || 0;
    // Verify totalQuestions calculation (should match overallTotal)
    // const calculatedTotal = totalStats.reduce((sum, stat) => sum + stat.count, 0);

    // --- Format Final Output ---
    const formattedStats = {
       totalQuestions: totalQuestions, // Overall total questions
       totalDone: totalDone,           // Total questions solved

       totalEasy: totalEasy,           // Total easy questions
       easyDone: easyDone,             // Easy questions solved

       totalMedium: totalMedium,       // Total medium questions
       mediumDone: mediumDone,         // Medium questions solved

       totalHard: totalHard,           // Total hard questions
       hardDone: hardDone              // Hard questions solved
    };

    res.status(200).json({ success: true, data: formattedStats });
});




exports.getPagedQuestions = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const searchTerm = req.query.search;
    const topicFilter = req.query.topic;
    const difficultyFilter = req.query.difficulty;
    let queryFilter = {};

    if (searchTerm) {
        const isNumeric = /^\d+$/.test(searchTerm);
        if (isNumeric) {
            queryFilter.questionNumber = Number(searchTerm);
        } else {
            const regex = new RegExp(searchTerm, 'i');
            queryFilter.questionName = regex;
        }
    }

    if (topicFilter) {
        queryFilter.topic = topicFilter;
    }

    if (difficultyFilter) {
        queryFilter.difficulty = difficultyFilter;
    }

    const startIndex = (page - 1) * limit;
    const totalCount = await Question.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages && totalPages > 0) {
        return res.status(404).json({ success: false, error: `Page ${page} does not exist.` });
    }

    const questions = await Question.find(queryFilter)
        .sort({ questionNumber: 1 })
        .skip(startIndex)
        .limit(limit);

    const pagination = {
        currentPage: page,
        totalPages,
        totalCount,
        limit
    };

    res.status(200).json({
        success: true,
        count: questions.length,
        pagination,
        data: questions
    });
});
