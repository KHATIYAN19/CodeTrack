import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaSearch, FaCheckCircle, FaRegCircle, FaExternalLinkAlt, FaFilter, FaTimes,
    FaChevronLeft, FaChevronRight, FaSpinner, FaExclamationCircle, FaTag, FaList,
    FaCode, FaLaptopCode, FaUniversity, FaTrashAlt, FaExclamationTriangle,
    FaChartBar, // Added for stats title
    FaTasks, FaCheck, // Added for stats cards
    FaBrain, FaBalanceScale, FaFire // Added for difficulty icons
} from 'react-icons/fa';
import _ from 'lodash';

const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://codetrack-backend-qfbz.onrender.com';
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

// --- PlatformIcon Component (Unchanged) ---
const PlatformIcon = ({ platformName }) => {
    // ... (keep existing implementation)
    if (!platformName) return <FaLaptopCode className="inline h-4 w-4 mr-1.5 text-gray-400" />;
    const lowerPlatform = platformName.toLowerCase();
    const iconConfig = {
        leetcode: { icon: FaLaptopCode, color: 'text-orange-500' },
        geeksforgeeks: { icon: FaUniversity, color: 'text-green-600' },
        gfg: { icon: FaUniversity, color: 'text-green-600' },
        codeforces: { icon: FaCode, color: 'text-blue-600' },
        default: { icon: FaCode, color: 'text-gray-500' }
    };
    const { icon: IconComponent, color } = iconConfig[lowerPlatform] || iconConfig.default;
    return <IconComponent className={`inline h-4 w-4 mr-1.5 ${color}`} />;
};


// --- getDifficultyStyles Function (Unchanged) ---
const getDifficultyStyles = (difficulty) => {
    // ... (keep existing implementation)
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'bg-green-100 text-green-800 border-green-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'hard': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// --- QuestionCard Component (Unchanged) ---
const QuestionCard = React.memo(({ q, handleToggleStatus, handleDeleteClick, style, isToggling }) => (
    // ... (keep existing implementation)
    <div
        style={style}
        className="group relative flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-in-out animate-fadeInUp"
    >
        <button
            onClick={() => !isToggling && handleToggleStatus(q._id, q.isDone)}
            className={`mr-4 text-2xl transition-all duration-200 ease-in-out transform ${
                !isToggling ? 'hover:scale-110' : ''
            } ${
                q.isDone ? 'text-indigo-500' : 'text-gray-300'
            } ${isToggling ? 'opacity-50 cursor-wait' : (q.isDone ? 'hover:text-indigo-700' : 'hover:text-gray-400')}`}
            title={isToggling ? "Updating..." : (q.isDone ? "Mark as Pending" : "Mark as Done")}
            disabled={isToggling}
        >
            {isToggling ? (
                <FaSpinner className="animate-spin" />
            ) : (
                q.isDone ? <FaCheckCircle /> : <FaRegCircle />
            )}
        </button>

        <div className="flex-1 min-w-0">
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
                    <FaTag className="mr-1 text-gray-400" />{q.topic || 'N/A'}
                </span>
                <span className="flex items-center text-gray-500">
                    <PlatformIcon platformName={q.platformName} />
                    {q.platformName || 'N/A'}
                </span>
            </div>
        </div>

        <div className="flex items-center ml-4 space-x-2 flex-shrink-0">
             <a
                href={q.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md flex items-center transition-all duration-150 ease-in-out text-xs font-medium transform hover:scale-105"
                title="Solve on platform"
            >
                <FaExternalLinkAlt className="mr-1.5 h-3 w-3" /> Solve
            </a>
             <button
                onClick={(e) => { e.stopPropagation(); handleDeleteClick(q._id, q.questionName); }}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all duration-150 ease-in-out focus:opacity-100 focus:ring-1 focus:ring-red-300 focus:outline-none transform hover:scale-110"
                title="Delete Question"
            >
                <FaTrashAlt className="h-4 w-4" />
            </button>
        </div>
    </div>
));

// --- ProgressBar Component (New) ---
const ProgressBar = ({ value, max, colorClass = 'bg-indigo-500' }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
            <div
                className={`${colorClass} h-1.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

// --- StatsCard Component (New) ---
const StatsCard = ({ title, icon: Icon, value, total, progressBarColor, description }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200/80 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fadeInUp">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
                    <Icon className={`h-5 w-5 ${progressBarColor.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-3xl font-bold text-gray-800">{value ?? '-'}</span>
                    {total !== undefined && total !== null && (
                        <span className="text-base font-medium text-gray-500">/ {total}</span>
                    )}
                </div>
                {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
            </div>
            {total !== undefined && total !== null && total >= 0 && (
                <div>
                    <ProgressBar value={value} max={total} colorClass={progressBarColor} />
                    <p className="text-right text-xs font-medium text-gray-500 mt-1">{percentage}% Complete</p>
                </div>
            )}
        </div>
    );
};


function QuestionListPage() {
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingIds, setTogglingIds] = useState(new Set());

    // --- Stats State (New) ---
    const [statsData, setStatsData] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);

    // --- API Call Functions (Added stats API) ---
    const fetchTopicsAPI = useCallback(async () => axios.get(`${API_BASE_URL}/topics`), []);
    const fetchPagedQuestionsAPI = useCallback(async (params) => axios.get(`${API_BASE_URL}/questions/paged`, { params }), []);
    const toggleQuestionStatusAPI = useCallback(async (questionId) => axios.put(`${API_BASE_URL}/questions/${questionId}/toggle`), []);
    const deleteQuestionAPI = useCallback(async (questionId) => axios.delete(`${API_BASE_URL}/questions/${questionId}`), []);
    // New API call for stats
    const fetchStatsAPI = useCallback(async () => axios.get(`${API_BASE_URL}/questions/stats`), []);


    // --- Debounce Search Term (Unchanged) ---
    const debouncedSearch = useMemo(
        () => _.debounce((term) => setDebouncedSearchTerm(term), 400),
        []
    );
    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch]);

    // --- Load Topics (Unchanged) ---
    useEffect(() => {
        const loadTopics = async () => {
            try {
                const response = await fetchTopicsAPI();
                if (response.data?.success) {
                    setTopics(response.data.data.sort((a, b) => a.name.localeCompare(b.name)));
                }
            } catch (err) {
                console.error("Topic Load Error:", err);
                // Optionally show a toast for topic load failure
            }
        };
        loadTopics();
    }, [fetchTopicsAPI]);


    // --- Load Stats (New Effect) ---
    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const response = await fetchStatsAPI();
            if (response.data?.success) {
                setStatsData(response.data.data);
            } else {
                throw new Error(response.data?.message || "Failed to fetch stats");
            }
        } catch (err) {
            console.error("Stats Load Error:", err);
            setStatsError(err.message || 'Failed to load stats');
            setStatsData(null); // Clear data on error
            toast.error("Could not load statistics."); // Notify user
        } finally {
            setStatsLoading(false);
        }
    }, [fetchStatsAPI]);

    useEffect(() => {
        loadStats();
    }, [loadStats]); // Load stats on mount

    // --- Load Questions (Modified to potentially refresh stats) ---
    const loadQuestions = useCallback(async (refreshStats = false) => { // Add param
        setIsLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                search: debouncedSearchTerm,
                topic: selectedTopic,
                difficulty: selectedDifficulty
            };
            const response = await fetchPagedQuestionsAPI(params);
            if (response.data?.success) {
                setQuestions(response.data.data);
                setTotalPages(response.data.pagination?.totalPages || 0);
                setTotalCount(response.data.pagination?.totalCount || 0);
                const fetchedTotalPages = response.data.pagination?.totalPages || 0;
                if (currentPage > fetchedTotalPages && fetchedTotalPages > 0) {
                     setCurrentPage(fetchedTotalPages);
                     // No need to recall loadQuestions here, the state change will trigger it
                }
            } else {
                 throw new Error(response.data?.message || "Failed to fetch questions");
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch questions');
            toast.error(err.message || 'Error loading questions');
            setQuestions([]);
            setTotalPages(0);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
            // Optionally refresh stats if requested (e.g., after delete/toggle)
            if (refreshStats) {
                loadStats();
            }
        }
    // Include loadStats in dependencies if you call it inside
    }, [currentPage, debouncedSearchTerm, selectedTopic, selectedDifficulty, fetchPagedQuestionsAPI, loadStats]);

    useEffect(() => {
        // Don't refresh stats on initial load here, as the other effect handles it
        loadQuestions(false);
    }, [loadQuestions]); // Re-run loadQuestions when its dependencies change

    // --- Event Handlers (Modified Toggle/Delete to refresh stats) ---

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        if (currentPage !== 1) setCurrentPage(1);
    };

    const handleTopicSelect = (topic) => {
         setSelectedTopic(prev => prev === topic ? '' : topic);
         if (currentPage !== 1) setCurrentPage(1);
    };

    const handleDifficultySelect = (difficulty) => {
         setSelectedDifficulty(prev => prev === difficulty ? '' : difficulty);
         if (currentPage !== 1) setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleToggleStatus = async (questionId, currentStatus) => {
        setTogglingIds(prev => new Set(prev).add(questionId));
        const toastId = toast.loading("Sending update request...");

        const originalQuestions = [...questions];
        const originalStatsData = statsData ? { ...statsData } : null; // Backup stats

        // Optimistic UI update for list
        setQuestions(prev => prev.map(q =>
            q._id === questionId ? { ...q, isDone: !q.isDone } : q
        ));
        // Optimistic UI update for stats
        if (statsData) {
            const question = originalQuestions.find(q => q._id === questionId);
            if (question) {
                const newStats = { ...statsData };
                const difficulty = question.difficulty?.toLowerCase();
                const change = !currentStatus ? 1 : -1; // +1 if marking done, -1 if marking pending

                newStats.totalDone = (newStats.totalDone || 0) + change;
                if (difficulty === 'easy') newStats.easyDone = (newStats.easyDone || 0) + change;
                else if (difficulty === 'medium') newStats.mediumDone = (newStats.mediumDone || 0) + change;
                else if (difficulty === 'hard') newStats.hardDone = (newStats.hardDone || 0) + change;

                // Ensure counts don't go below zero
                newStats.totalDone = Math.max(0, newStats.totalDone);
                newStats.easyDone = Math.max(0, newStats.easyDone || 0);
                newStats.mediumDone = Math.max(0, newStats.mediumDone || 0);
                newStats.hardDone = Math.max(0, newStats.hardDone || 0);

                setStatsData(newStats);
            }
        }


        try {
            const response = await toggleQuestionStatusAPI(questionId);
            toast.success(response.data?.data?.isDone ? "Marked as Done!" : "Marked as Pending", { id: toastId });
            // Stats will be fully re-fetched for consistency after success
            loadStats(); // Refresh stats from API after successful toggle
        } catch (err) {
            setQuestions(originalQuestions); // Revert list
            setStatsData(originalStatsData); // Revert stats
            toast.error("Failed to update status. Please try again.", { id: toastId });
            console.error("Toggle Status Error:", err);
        } finally {
            setTogglingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(questionId);
                return newSet;
            });
        }
    };


    const handleDeleteClick = (id, name) => {
        setShowDeleteConfirm({ id, name });
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
        setIsDeleting(false);
    };

    const handleConfirmDelete = async () => {
        if (!showDeleteConfirm) return;
        setIsDeleting(true);
        const toastId = toast.loading(`Deleting "${showDeleteConfirm.name}"...`);
        try {
            await deleteQuestionAPI(showDeleteConfirm.id);
            toast.success(`Question deleted successfully!`, { id: toastId });
            setShowDeleteConfirm(null);

             // Reload questions, adjusting page if necessary AND refresh stats
            const goingToPreviousPage = questions.length === 1 && currentPage > 1;
            if (goingToPreviousPage) {
                 setCurrentPage(currentPage - 1); // This state change will trigger loadQuestions via useEffect
                 // loadQuestions will then trigger loadStats
            } else {
                 loadQuestions(true); // Reload current page and explicitly refresh stats
            }

        } catch (err) {
             console.error("Delete Error:", err);
             toast.error(err.response?.data?.error || "Failed to delete question.", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    const clearFiltersAndSearch = () => {
        const needsReload = debouncedSearchTerm || selectedTopic || selectedDifficulty;
        setSearchTerm('');
        // setDebouncedSearchTerm(''); // This happens via useEffect
        setSelectedTopic('');
        setSelectedDifficulty('');
        if (currentPage !== 1) {
            setCurrentPage(1); // Let the page change trigger reload
        } else if (needsReload) {
            // If already on page 1 but filters were active, trigger reload manually
            loadQuestions();
        }
        setShowFilters(false);
    };

    // --- Calculated Values (Unchanged) ---
    const hasActiveFiltersOrSearch = !!debouncedSearchTerm || !!selectedTopic || !!selectedDifficulty;
    const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE - 1, totalCount);

    // --- Pagination Buttons (Unchanged, but ensure handlePageChange is in deps) ---
    const paginationButtons = useMemo(() => {
        // ... (keep existing implementation)
        if (totalPages <= 1) return null;
        const buttons = [];
        const maxButtonsToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

         if (totalPages > maxButtonsToShow) {
             if (endPage === totalPages) {
                 startPage = Math.max(1, totalPages - maxButtonsToShow + 1);
            } else if (startPage === 1) {
                 endPage = Math.min(totalPages, maxButtonsToShow);
            }
            if (endPage - startPage + 1 < maxButtonsToShow && startPage > 1) {
                 startPage = Math.max(1, endPage - maxButtonsToShow + 1);
            }
        }

        if (startPage > 1) {
            buttons.push(<button key="1" onClick={() => handlePageChange(1)} className="px-3 py-1 mx-0.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">1</button>);
            if (startPage > 2) {
                buttons.push(<span key="start-ellipsis" className="px-1 py-1 text-gray-400 text-sm">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-0.5 rounded-md text-sm font-medium border transition-colors ${
                        currentPage === i
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm z-10'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                    aria-current={currentPage === i ? 'page' : undefined}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="end-ellipsis" className="px-1 py-1 text-gray-400 text-sm">...</span>);
            }
            buttons.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1 mx-0.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">{totalPages}</button>);
        }

        return buttons;
    }, [currentPage, totalPages, handlePageChange]); // Added handlePageChange


    // --- JSX Structure ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />

                {/* --- Page Title --- */}
                 <div className="mb-8 text-center animate-fadeInUp">
                     <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
                        DSA Question Bank
                     </h1>
                     <p className="text-indigo-700 font-medium">Refine your skills with targeted practice.</p>
                 </div>

                {/* --- Stats Section (New) --- */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center animate-fadeInUp" style={{ animationDelay: '50ms' }}>
                        <FaChartBar className="mr-3 text-indigo-500" /> Statistics Overview
                    </h2>
                    {statsLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-lg p-5 border border-gray-200/80 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                                    <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
                                    <div className="h-1.5 bg-gray-200 rounded-full mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4 float-right"></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {statsError && !statsLoading && (
                         <div className="p-5 text-center text-red-700 bg-red-100 rounded-lg border border-red-200 shadow-sm animate-fadeIn">
                             <FaExclamationCircle className="mx-auto text-3xl mb-2 text-red-500" />
                             <p className="font-semibold">Could not load statistics.</p>
                             <p className="text-sm">{statsError}</p>
                             <button onClick={loadStats} className="mt-3 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-lg hover:bg-indigo-200 transition-colors">
                                 Retry
                             </button>
                         </div>
                    )}
                    {!statsLoading && !statsError && statsData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                title="Total Solved"
                                icon={FaCheck}
                                value={statsData.totalDone}
                                total={statsData.totalQuestions}
                                progressBarColor="bg-indigo-500"
                                description="Overall progress across all difficulties."
                            />
                            <StatsCard
                                title="Easy Solved"
                                icon={FaBrain}
                                value={statsData.easyDone}
                                total={statsData.totalEasy}
                                progressBarColor="bg-green-500"
                                description="Focus: Foundational concepts."
                            />
                            <StatsCard
                                title="Medium Solved"
                                icon={FaBalanceScale}
                                value={statsData.mediumDone}
                                total={statsData.totalMedium}
                                progressBarColor="bg-yellow-500"
                                description="Focus: Core problem-solving."

                            />
                            <StatsCard
                                title="Hard Solved"
                                icon={FaFire}
                                value={statsData.hardDone}
                                total={statsData.totalHard}
                                progressBarColor="bg-red-500"
                                description="Focus: Advanced techniques."
                            />
                        </div>
                    )}
                </div>


                {/* --- Search and Filter Bar --- */}
                <div className="mb-6 bg-white rounded-xl shadow-lg p-5 border border-gray-200/80 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Search Input */}
                        <div className="flex-1 w-full relative">
                            <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search questions (e.g., Two Sum, DFS...)"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                                aria-label="Search questions"
                            />
                        </div>

                        {/* Filter/Clear Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium border rounded-lg transition-all duration-150 ease-in-out shadow-sm transform hover:scale-105 ${
                                    showFilters
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-1 ring-indigo-200'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                aria-expanded={showFilters}
                            >
                                <FaFilter className="mr-2 h-4 w-4" /> Filters {showFilters ? <FaTimes className="ml-2 h-3 w-3" /> : null}
                            </button>

                            {hasActiveFiltersOrSearch && (
                                <button
                                    onClick={clearFiltersAndSearch}
                                    className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-150 shadow-sm transform hover:scale-105"
                                    title="Clear filters and search"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Options Panel */}
                    {showFilters && (
                        <div className="mt-5 pt-5 border-t border-gray-200 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                {/* Difficulty Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaList className="mr-1.5 text-gray-400"/> Difficulty
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {['', ...DIFFICULTY_LEVELS].map(level => (
                                            <button
                                                key={level || 'all-diff'}
                                                onClick={() => handleDifficultySelect(level)}
                                                className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${
                                                    selectedDifficulty === level
                                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                                }`}
                                                aria-pressed={selectedDifficulty === level}
                                            >
                                                {level || 'All'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaTag className="mr-1.5 text-gray-400"/> Topics
                                    </h3>
                                    {topics.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                            <button
                                                onClick={() => handleTopicSelect('')}
                                                className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${
                                                    selectedTopic === ''
                                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                                }`}
                                                aria-pressed={selectedTopic === ''}
                                            >
                                                All Topics
                                            </button>
                                            {topics.map(topic => (
                                                <button
                                                    key={topic._id}
                                                    onClick={() => handleTopicSelect(topic.name)}
                                                    className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${
                                                        selectedTopic === topic.name
                                                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                                    }`}
                                                    aria-pressed={selectedTopic === topic.name}
                                                >
                                                    {topic.name}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">No topics available to filter.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Question List Area --- */}
                <div className="space-y-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="p-12 text-center">
                            <FaSpinner className="animate-spin mx-auto text-4xl text-indigo-500" />
                            <p className="mt-2 text-sm text-gray-600">Loading questions...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!isLoading && error && (
                         <div className="p-8 text-center text-red-700 bg-red-100 rounded-lg border border-red-200 shadow-sm animate-fadeIn">
                             <FaExclamationCircle className="mx-auto text-4xl mb-3 text-red-500" />
                             <p className="font-semibold text-lg">Oops! Something went wrong.</p>
                             <p className="text-sm">{error}</p>
                              <button onClick={() => loadQuestions()} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-lg hover:bg-indigo-200 transition-colors">
                                 Try Again
                              </button>
                         </div>
                    )}

                    {/* No Results State */}
                    {!isLoading && !error && questions.length === 0 && (
                         <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
                             <FaSearch className="mx-auto text-4xl mb-3 text-gray-400" />
                             <p className="font-medium text-lg">No questions found</p>
                             <p className="text-sm mb-4">
                                 {hasActiveFiltersOrSearch
                                     ? "Try adjusting your search or filters."
                                     : "There are no questions yet. Add some!"}
                              </p>
                             {hasActiveFiltersOrSearch && (
                                 <button onClick={clearFiltersAndSearch} className="text-sm text-indigo-600 hover:underline font-medium">
                                     Clear filters and search
                                 </button>
                             )}
                         </div>
                    )}

                    {/* Question Cards */}
                    {!isLoading && !error && questions.length > 0 && (
                        questions.map((q, index) => (
                            <QuestionCard
                                key={q._id}
                                q={q}
                                handleToggleStatus={handleToggleStatus}
                                handleDeleteClick={handleDeleteClick}
                                style={{ animationDelay: `${index * 40}ms` }} // Stagger animation
                                isToggling={togglingIds.has(q._id)}
                            />
                        ))
                    )}
                </div>

                {/* --- Pagination --- */}
                {!isLoading && !error && questions.length > 0 && totalPages > 0 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200/80">
                        <p className="text-sm text-gray-700 mb-3 sm:mb-0">
                            Showing <span className="font-semibold">{startIndex}</span>-<span className="font-semibold">{endIndex}</span> of <span className="font-semibold">{totalCount}</span> results
                        </p>

                        {totalPages > 1 && (
                             <div className="flex items-center gap-1">
                                 <button
                                     onClick={() => handlePageChange(currentPage - 1)}
                                     disabled={currentPage === 1}
                                     className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                     aria-label="Previous Page"
                                 >
                                     <FaChevronLeft className="h-4 w-4" />
                                 </button>

                                 <nav className="mx-1 flex items-center space-x-px" aria-label="Pagination">
                                      {paginationButtons}
                                 </nav>

                                 <button
                                     onClick={() => handlePageChange(currentPage + 1)}
                                     disabled={currentPage === totalPages}
                                     className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                     aria-label="Next Page"
                                 >
                                     <FaChevronRight className="h-4 w-4" />
                                 </button>
                             </div>
                        )}
                    </div>
                )}

            </div>

            {/* --- Delete Confirmation Modal (Unchanged) --- */}
            {showDeleteConfirm && (
                 <div
                     className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn"
                     onClick={handleCancelDelete}
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="delete-modal-title"
                 >
                      <div
                         className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md m-4 transform transition-all duration-300 ease-out scale-100 animate-zoomIn"
                         onClick={(e) => e.stopPropagation()}
                         role="document"
                     >
                         <div className="flex justify-center mb-4">
                              <div className="p-3 rounded-full bg-red-100 text-red-600">
                                  <FaExclamationTriangle className="h-6 w-6" />
                             </div>
                         </div>
                         <h3 id="delete-modal-title" className="text-xl font-semibold text-slate-800 mb-3 text-center">Delete Question?</h3>
                         <p className="text-sm text-slate-600 mb-6 text-center px-4">
                             Are you sure you want to delete <br/>
                              <strong className="text-slate-700 text-base">"{showDeleteConfirm.name}"</strong>?
                             <br/> This action cannot be undone.
                         </p>
                         <div className="flex justify-center space-x-4">
                              <button
                                 onClick={handleCancelDelete}
                                 disabled={isDeleting}
                                 className="px-6 py-2.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition duration-150 ease-in-out disabled:opacity-70 transform hover:scale-105"
                             >
                                 Cancel
                             </button>
                              <button
                                 onClick={handleConfirmDelete}
                                 disabled={isDeleting}
                                 className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-wait transform hover:scale-105 flex items-center justify-center"
                             >
                                 {isDeleting ? <FaSpinner className="animate-spin h-4 w-4 inline mr-1.5" /> : null}
                                 {isDeleting ? 'Deleting...' : 'Delete'}
                             </button>
                         </div>
                     </div>
                 </div>
            )}

             {/* --- Global Styles (Unchanged) --- */}
             <style jsx global>{`
                 .custom-scrollbar::-webkit-scrollbar {
                     width: 6px;
                 }
                 .custom-scrollbar::-webkit-scrollbar-track {
                     background: #f1f1f1;
                     border-radius: 3px;
                 }
                 .custom-scrollbar::-webkit-scrollbar-thumb {
                     background: #ccc;
                     border-radius: 3px;
                 }
                 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                     background: #aaa;
                 }
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

export default QuestionListPage;