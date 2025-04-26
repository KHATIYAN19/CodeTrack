import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaAngleLeft, FaSpinner, FaExclamationTriangle, FaExternalLinkAlt, FaCheck, FaTag, FaBuilding,
    FaSyncAlt, FaChartBar, FaThumbsUp, FaListOl, FaLaptopCode, FaCheckCircle, FaHourglassHalf,
    FaTrashAlt,
    FaUndo 
} from 'react-icons/fa';
import { FaUniversity,FaCode  } from 'react-icons/fa';

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://codetrack-backend-qfbz.onrender.com';

const fetchQuestionsByTopicAPI = async (topicName) => {
    return axios.get(`${API_BASE_URL}/questions`, { params: { topic: topicName, limit: 1000 } });
};

const toggleQuestionStatusAPI = async (questionId) => {
    return axios.put(`${API_BASE_URL}/questions/${questionId}/toggle`);
};

const deleteQuestionAPI = async (questionId) => {
    return axios.delete(`${API_BASE_URL}/questions/${questionId}`);
};

const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

const getDifficultyStyles = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'text-green-700 bg-green-100 border-green-200';
        case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
        case 'hard': return 'text-red-700 bg-red-100 border-red-200';
        default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
};

const getStatusStyles = (isDone) => {
    return isDone
        ? 'text-indigo-700 bg-indigo-100 border-indigo-200 hover:bg-indigo-200'
        : 'text-gray-600 bg-gray-100 border-gray-200 hover:bg-gray-200';
};

const PlatformIcon = ({ platformName }) => {
    if (!platformName) return <FaLaptopCode className="inline h-3 w-3 mr-1 text-gray-400" />;
    const lowerPlatform = platformName.toLowerCase();
    const iconConfig = {
        leetcode: { icon: FaLaptopCode, color: 'text-orange-500' },
        geeksforgeeks: { icon: FaUniversity, color: 'text-green-600' },
        gfg: { icon: FaUniversity, color: 'text-green-600' },
        codeforces: { icon: FaCode, color: 'text-blue-600' },
        default: { icon: FaCode, color: 'text-gray-500' }
    };
    const { icon: IconComponent, color } = iconConfig[lowerPlatform] || iconConfig.default;
    return <IconComponent className={`inline h-3 w-3 mr-1 ${color}`} />;
};


function TopicQuestionsPage() {
    const { topicName: encodedTopicName } = useParams();
    const topicName = decodeURIComponent(encodedTopicName || '');

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [totalQuestionsInTopic, setTotalQuestionsInTopic] = useState(0);
    const [solvedQuestionsInTopic, setSolvedQuestionsInTopic] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // { id, name }
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUnmarkingAll, setIsUnmarkingAll] = useState(false);


    const loadQuestions = useCallback(async () => {
        if (!topicName) {
            setError("Topic name not provided.");
            setIsLoading(false);
            return;
        }
        if (!updatingStatusId && !isUnmarkingAll) setIsLoading(true); // Only show full load if not updating status
        setError(null);
        try {
            const response = await fetchQuestionsByTopicAPI(topicName);
            let fetchedQuestions = [];

            if (response.data?.success && Array.isArray(response.data.data)) {
                 if (response.data.data[0]?.questions && response.data.data[0]?.topic) {
                     const topicData = response.data.data.find(group => group.topic === topicName);
                     fetchedQuestions = topicData?.questions || [];
                 } else {
                     fetchedQuestions = response.data.data;
                 }

                 const sortedQuestions = fetchedQuestions.sort((a, b) => {
                    const diffA = difficultyOrder[a.difficulty] || 99;
                    const diffB = difficultyOrder[b.difficulty] || 99;
                    if (diffA !== diffB) return diffA - diffB;
                    const nameA = a.questionName || '';
                    const nameB = b.questionName || '';
                    return nameA.localeCompare(nameB);
                });

                setQuestions(sortedQuestions);
                const total = sortedQuestions.length;
                const solved = sortedQuestions.filter(q => q.isDone).length;
                setTotalQuestionsInTopic(total);
                setSolvedQuestionsInTopic(solved);
            } else {
                setQuestions([]); setTotalQuestionsInTopic(0); setSolvedQuestionsInTopic(0);
                throw new Error(response.data?.message || "Invalid data structure for questions.");
            }
        } catch (err) {
            console.error(`Failed to fetch questions for topic "${topicName}":`, err);
            setError(err.response?.data?.error || err.message || "Could not load questions for this topic.");
            setQuestions([]); setTotalQuestionsInTopic(0); setSolvedQuestionsInTopic(0);
            toast.error(`Failed to load questions for ${topicName}.`);
        } finally {
             if (!updatingStatusId && !isUnmarkingAll) setIsLoading(false);
        }
    }, [topicName, updatingStatusId, isUnmarkingAll]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const questionsByDifficulty = useMemo(() => {
        const grouped = { Easy: [], Medium: [], Hard: [], Other: [] };
        questions.forEach(q => {
            const difficultyKey = q.difficulty && difficultyOrder[q.difficulty] ? q.difficulty : 'Other';
            grouped[difficultyKey].push(q);
        });
        return grouped;
    }, [questions]);

    const handleStatusToggle = async (questionId, currentStatus) => {
        setUpdatingStatusId(questionId);
        const originalQuestions = [...questions];
        let newSolvedCount = solvedQuestionsInTopic;
        const updatedQuestions = originalQuestions.map(q => {
            if (q._id === questionId) {
                if (!currentStatus) newSolvedCount++; else newSolvedCount--;
                return { ...q, isDone: !currentStatus };
            } return q;
        });
        setQuestions(updatedQuestions);
        setSolvedQuestionsInTopic(newSolvedCount);
        try {
            await toggleQuestionStatusAPI(questionId);
        } catch (err) {
            console.error("Failed to update status:", err);
            setQuestions(originalQuestions);
            const originalSolved = originalQuestions.filter(q => q.isDone).length;
            setSolvedQuestionsInTopic(originalSolved);
            toast.error(err.response?.data?.error || "Failed to update status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleDeleteClick = (id, name) => {
        setShowDeleteConfirm({ id, name });
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    const handleConfirmDelete = async () => {
        if (!showDeleteConfirm) return;
        setIsDeleting(true);
        const toastId = toast.loading(`Deleting "${showDeleteConfirm.name}"...`);
        try {
            await deleteQuestionAPI(showDeleteConfirm.id);
            toast.success(`Question deleted successfully!`, { id: toastId });
            setShowDeleteConfirm(null);
            loadQuestions(); // Refresh the list after deleting
        } catch (err) {
             console.error("Delete Error:", err);
             toast.error(err.response?.data?.error || "Failed to delete question.", { id: toastId });
             setShowDeleteConfirm(null); // Close modal even on error
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUnmarkAll = async () => {
        const doneQuestions = questions.filter(q => q.isDone);
        if (doneQuestions.length === 0) {
            toast.success("No questions are currently marked as done.");
            return;
        }

        setIsUnmarkingAll(true);
        const toastId = toast.loading(`Unmarking ${doneQuestions.length} question(s)...`);

        // Optimistic UI Update
        setQuestions(prev => prev.map(q => q.isDone ? { ...q, isDone: false } : q));
        setSolvedQuestionsInTopic(0);

        const promises = doneQuestions.map(q => toggleQuestionStatusAPI(q._id));

        try {
            const results = await Promise.allSettled(promises);
            const failedCount = results.filter(r => r.status === 'rejected').length;

            if (failedCount === 0) {
                toast.success(`Successfully unmarked ${doneQuestions.length} question(s).`, { id: toastId });
            } else {
                toast.error(`Failed to unmark ${failedCount} question(s). Please check manually.`, { id: toastId, duration: 4000 });
                // Optionally trigger a full refresh to get consistent state from backend
                loadQuestions();
            }
        } catch (err) {
             // This catch block might not be strictly necessary with Promise.allSettled
             // but kept for safety.
             console.error("Error during unmark all:", err);
             toast.error("An unexpected error occurred while unmarking questions.", { id: toastId });
             loadQuestions(); // Refresh to sync state
        } finally {
            setIsUnmarkingAll(false);
        }
    };


    const renderDifficultySection = (level, levelQuestions) => {
        if (levelQuestions.length === 0) return null;

        const headerStyles = {
            Easy: 'border-green-500 text-green-700',
            Medium: 'border-yellow-500 text-yellow-700',
            Hard: 'border-red-500 text-red-700',
            Other: 'border-gray-500 text-gray-700'
        };

        return (
            <div key={level} className="mb-10 last:mb-0 animate-fadeInUp" style={{ animationDelay: `${difficultyOrder[level] * 100}ms` }}>
                <h2 className={`text-2xl font-semibold mb-5 pb-2 border-b-2 ${headerStyles[level]}`}>
                    {level} <span className="text-base font-normal text-gray-500">({levelQuestions.length})</span>
                </h2>
                <div className="space-y-3">
                    {levelQuestions.map((q, index) => (
                        <div
                            key={q._id}
                            style={{ animationDelay: `${index * 30}ms` }} // Stagger card animation
                            className="group relative flex items-center p-4 bg-white rounded-xl shadow-md border border-gray-200/80 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1 animate-fadeInUp"
                        >
                            <button
                                onClick={() => handleStatusToggle(q._id, q.isDone)}
                                disabled={updatingStatusId === q._id}
                                className={`flex-shrink-0 mr-4 p-2 inline-flex items-center justify-center rounded-full border transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-wait transform hover:scale-110 ${getStatusStyles(q.isDone)}`}
                                title={q.isDone ? 'Mark as Pending' : 'Mark as Completed'}
                            >
                                {updatingStatusId === q._id ? <FaSyncAlt className="h-4 w-4 text-gray-500 animate-spin" /> : q.isDone ? <FaCheckCircle className="h-4 w-4 text-indigo-600" /> : <FaHourglassHalf className="h-4 w-4 text-gray-400" />}
                            </button>

                            <div className="flex-grow min-w-0">
                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-1.5">
                                    {q.questionNumber && (
                                        <span className="flex-shrink-0 text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                            #{q.questionNumber}
                                        </span>
                                    )}
                                    <h3 className="text-base font-semibold text-gray-800 truncate" title={q.questionName}>
                                        {q.questionName}
                                    </h3>
                                </div>
                                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${getDifficultyStyles(q.difficulty)}`}>
                                        {q.difficulty || 'N/A'}
                                    </span>
                                    <span className="flex items-center text-gray-500">
                                        <PlatformIcon platformName={q.platformName} />
                                        {q.platformName || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center ml-4 space-x-2 flex-shrink-0">
                                 <a
                                    href={q.link} target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center transition-all duration-150 ease-in-out text-xs font-medium transform hover:scale-105 border border-indigo-100 hover:border-indigo-200"
                                    title="Solve on platform"
                                >
                                    <FaExternalLinkAlt className="mr-1.5 h-3 w-3" /> Solve
                                </a>
                                 <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(q._id, q.questionName); }}
                                    className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-red-300"
                                    title="Delete Question"
                                >
                                    <FaTrashAlt className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100">
            <Toaster position="top-center" reverseOrder={false} />

            <div className="mb-6 flex items-center justify-between flex-wrap gap-y-3">
                 <Link to="/topics" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-150 ease-in-out">
                    <FaAngleLeft className="mr-1 h-4 w-4" />
                    Back to Topics
                </Link>
                 <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center flex-1 px-4 animate-fadeInUp">
                    {topicName ? (
                        <>Topic: <span className="text-indigo-700">{topicName}</span></>
                    ) : ( 'Loading Topic...' )}
                 </h1>
                 <div className="w-28 sm:w-32"> {/* Spacer */} </div>
            </div>

            {!isLoading && !error && questions.length >= 0 && (
                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200/80 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-200 ease-out">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600"> <FaChartBar className="h-5 w-5" /> </div>
                        <div> <p className="text-sm text-gray-500">Total</p> <p className="text-xl font-semibold text-gray-800">{totalQuestionsInTopic}</p> </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200/80 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-200 ease-out">
                         <div className="p-3 rounded-full bg-green-100 text-green-600"> <FaCheckCircle className="h-5 w-5" /> </div>
                        <div> <p className="text-sm text-gray-500">Solved</p> <p className="text-xl font-semibold text-gray-800">{solvedQuestionsInTopic}</p> </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200/80 flex items-center space-x-3 transform hover:scale-105 transition-transform duration-200 ease-out">
                         <div className="p-3 rounded-full bg-indigo-100 text-indigo-600"> <span className="text-lg font-bold">%</span> </div>
                        <div> <p className="text-sm text-gray-500">Completion</p> <p className="text-xl font-semibold text-gray-800"> {totalQuestionsInTopic > 0 ? Math.round((solvedQuestionsInTopic / totalQuestionsInTopic) * 100) : 0}% </p> </div>
                    </div>
                     {/* Unmark All Button */}
                     <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-200/80 flex items-center justify-center transform hover:scale-105 transition-transform duration-200 ease-out">
                         <button
                            onClick={handleUnmarkAll}
                            disabled={isUnmarkingAll || solvedQuestionsInTopic === 0}
                            className="w-full flex items-center justify-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200 hover:bg-yellow-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out text-sm font-medium"
                            title={solvedQuestionsInTopic === 0 ? "No questions to unmark" : "Unmark all completed questions in this topic"}
                        >
                            {isUnmarkingAll ? <FaSpinner className="animate-spin mr-2 h-4 w-4" /> : <FaUndo className="mr-2 h-4 w-4" />}
                            {isUnmarkingAll ? 'Unmarking...' : 'Unmark All'}
                        </button>
                    </div>
                </div>
            )}

            {isLoading && questions.length === 0 ? (
                <div className="flex justify-center items-center p-10 text-gray-600"> <FaSpinner className="animate-spin text-indigo-600 text-3xl mr-3" /> Loading Questions... </div>
            ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-sm animate-fadeIn"> <FaExclamationTriangle className="inline-block mr-2 text-xl" /> {error} </div>
            ) : !isLoading && questions.length === 0 ? (
                 <p className="p-6 text-center text-gray-500 bg-white rounded-lg shadow border animate-fadeIn"> No questions found for the topic "{topicName}". </p>
            ) : (
                <div key={topicName} className="transition-opacity duration-500 ease-in-out opacity-100">
                    {renderDifficultySection('Easy', questionsByDifficulty.Easy)}
                    {renderDifficultySection('Medium', questionsByDifficulty.Medium)}
                    {renderDifficultySection('Hard', questionsByDifficulty.Hard)}
                    {renderDifficultySection('Other', questionsByDifficulty.Other)}
                </div>
            )}

             {/* Delete Confirmation Modal */}
             {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn" onClick={handleCancelDelete}>
                    <div className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md m-4 transform transition-all duration-300 ease-out scale-100 animate-zoomIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center mb-4"> <div className="p-3 rounded-full bg-red-100 text-red-600"> <FaExclamationTriangle className="h-6 w-6" /> </div> </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-3 text-center">Delete Question?</h3>
                        <p className="text-sm text-slate-600 mb-6 text-center px-4"> Are you sure you want to delete <br/> <strong className="text-slate-700 text-base">"{showDeleteConfirm.name}"</strong>? <br/> This action cannot be undone. </p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={handleCancelDelete} disabled={isDeleting} className="px-6 py-2.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition duration-150 ease-in-out disabled:opacity-70 transform hover:scale-105"> Cancel </button>
                            <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-wait transform hover:scale-105">
                                {isDeleting ? <FaSpinner className="animate-spin h-4 w-4 inline mr-1.5" /> : null} {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-zoomIn { animation: zoomIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}

export default TopicQuestionsPage;
