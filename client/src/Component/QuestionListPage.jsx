import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaSearch, FaCheckCircle, FaRegCircle, FaExternalLinkAlt, FaFilter, FaTimes,
    FaChevronLeft, FaChevronRight, FaSpinner, FaExclamationCircle, FaTag, FaList, FaHashtag,
    FaCode, FaLaptopCode, FaUniversity, FaTrashAlt, FaExclamationTriangle // Added Trash icon
} from 'react-icons/fa';
import _ from 'lodash'; // Assuming lodash is installed for debounce

// --- Constants ---
const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
// Define the fixed difficulty levels here
const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];


// --- Helper Components ---
// (PlatformIcon, getDifficultyStyles remain the same)

const PlatformIcon = ({ platformName }) => {
    // ... (keep existing code)
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

const getDifficultyStyles = (difficulty) => {
    // ... (keep existing code)
    switch (difficulty?.toLowerCase()) {
        case 'easy': return 'bg-green-100 text-green-800 border-green-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'hard': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// --- Question Card Component ---
// (QuestionCard remains the same)
const QuestionCard = React.memo(({ q, handleToggleStatus, handleDeleteClick, style }) => (
 // ... (keep existing code)
  <div
        style={style} // Apply animation delay style
        className="group relative flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-in-out animate-fadeInUp"
    >
        {/* Status Toggle */}
        <button
            onClick={() => handleToggleStatus(q._id, q.isDone)}
            className={`mr-4 text-2xl transition-transform duration-200 ease-in-out transform hover:scale-110 ${q.isDone ? 'text-indigo-500 hover:text-indigo-700' : 'text-gray-300 hover:text-gray-400'}`}
            title={q.isDone ? "Mark as Pending" : "Mark as Done"}
        >
            {q.isDone ? <FaCheckCircle /> : <FaRegCircle />}
        </button>

        {/* Question Details */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-1.5">
                {/* Question Number */}
                {q.questionNumber && (
                    <span className="flex-shrink-0 text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{q.questionNumber}
                    </span>
                )}
                {/* Question Title */}
                <h3 className="text-base font-semibold text-gray-800 truncate" title={q.questionName}>
                    {q.questionName}
                </h3>
            </div>

            {/* Meta Info */}
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

        {/* Action Buttons */}
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


// --- Main Component ---
function QuestionListPage() {
    const [questions, setQuestions] = useState([]);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState(''); // Default to 'All' (empty string)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // { id, name }
    const [isDeleting, setIsDeleting] = useState(false);

    // --- API Functions ---
    // (Keep existing API functions: fetchTopicsAPI, fetchPagedQuestionsAPI, toggleQuestionStatusAPI, deleteQuestionAPI)
     const fetchTopicsAPI = useCallback(async () => axios.get(`${API_BASE_URL}/topics`), []);
    const fetchPagedQuestionsAPI = useCallback(async (params) => axios.get(`${API_BASE_URL}/questions/paged`, { params }), []);
    const toggleQuestionStatusAPI = useCallback(async (questionId) => axios.put(`${API_BASE_URL}/questions/${questionId}/toggle`), []);
    const deleteQuestionAPI = useCallback(async (questionId) => axios.delete(`${API_BASE_URL}/questions/${questionId}`), []); // Added delete API call


    // --- Hooks and Handlers ---
    // (Keep existing useEffects for debounce, topics, questions)
    // (Keep existing handlers: handleSearchChange, handleTopicSelect, handleDifficultySelect, handlePageChange, handleToggleStatus, handleDeleteClick, handleCancelDelete, handleConfirmDelete, clearFiltersAndSearch)

    // Debounce Search
    const debouncedSearch = useMemo(
        () => _.debounce((term) => setDebouncedSearchTerm(term), 400),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => debouncedSearch.cancel();
    }, [searchTerm, debouncedSearch]);

    // Load Topics
    useEffect(() => {
        const loadTopics = async () => {
            try {
                const response = await fetchTopicsAPI();
                if (response.data?.success) {
                    // Ensure topics are sorted for consistent display
                    setTopics(response.data.data.sort((a, b) => a.name.localeCompare(b.name)));
                }
            } catch (err) {
                console.error("Topic Load Error:", err);
                // Optionally set an error state or show a toast
            }
        };
        loadTopics();
    }, [fetchTopicsAPI]);

    // Load Questions
    const loadQuestions = useCallback(async () => {
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
                // Adjust current page if it becomes invalid after filtering/deletion
                 if (currentPage > fetchedTotalPages && fetchedTotalPages > 0) {
                     setCurrentPage(fetchedTotalPages);
                 } else if (response.data.data.length === 0 && currentPage > 1 && !debouncedSearchTerm && !selectedTopic && !selectedDifficulty) {
                     // If no results on a page > 1 AND no filters applied, maybe go back? Or stay? Depends on desired UX.
                     // Going back to page 1 might be safer if the total count decreased significantly.
                     // setCurrentPage(1); // Optional: Reset to page 1 if current page becomes empty without filters
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
        }
    }, [currentPage, debouncedSearchTerm, selectedTopic, selectedDifficulty, fetchPagedQuestionsAPI]); // Added dependencies


    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]); // Dependency array includes loadQuestions

    // Handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        if (currentPage !== 1) setCurrentPage(1); // Reset to page 1 on search change
    };

     const handleTopicSelect = (topic) => {
         // If the clicked topic is already selected, deselect it (set to 'All'/''), otherwise select it.
         setSelectedTopic(prev => prev === topic ? '' : topic);
         if (currentPage !== 1) setCurrentPage(1); // Reset page on filter change
     };

     const handleDifficultySelect = (difficulty) => {
         // If the clicked difficulty is already selected, deselect it (set to 'All'/''), otherwise select it.
         setSelectedDifficulty(prev => prev === difficulty ? '' : difficulty);
         if (currentPage !== 1) setCurrentPage(1); // Reset page on filter change
     };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
        }
    };

    const handleToggleStatus = async (questionId, currentStatus) => {
        // Optimistic update
        const originalQuestions = [...questions];
        setQuestions(prev => prev.map(q =>
            q._id === questionId ? { ...q, isDone: !q.isDone } : q
        ));

        try {
            const response = await toggleQuestionStatusAPI(questionId);
            toast.success(response.data?.data?.isDone ? "Marked as Done!" : "Marked as Pending");
            // Optionally reload data if status affects sorting/filtering logic not handled client-side
            // loadQuestions();
        } catch (err) {
            setQuestions(originalQuestions); // Revert on error
            toast.error("Failed to update status");
            console.error("Toggle Status Error:", err);
        }
    };

    const handleDeleteClick = (id, name) => {
        setShowDeleteConfirm({ id, name });
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
        setIsDeleting(false); // Ensure deleting state is reset
    };

    const handleConfirmDelete = async () => {
        if (!showDeleteConfirm) return;
        setIsDeleting(true);
        const toastId = toast.loading(`Deleting "${showDeleteConfirm.name}"...`);
        try {
            await deleteQuestionAPI(showDeleteConfirm.id);
            toast.success(`Question deleted successfully!`, { id: toastId });
            setShowDeleteConfirm(null);

            // Smartly reload or adjust page
            // If the deleted item was the last one on the current page (and it's not page 1), go to the previous page.
            if (questions.length === 1 && currentPage > 1) {
                 setCurrentPage(currentPage - 1); // This will trigger loadQuestions via useEffect
             } else {
                 loadQuestions(); // Otherwise, just reload the current page
             }

        } catch (err) {
             console.error("Delete Error:", err);
             toast.error(err.response?.data?.error || "Failed to delete question.", { id: toastId });
        } finally {
            setIsDeleting(false); // Reset deleting state regardless of success/failure
        }
    };

    const clearFiltersAndSearch = () => {
        const needsReload = debouncedSearchTerm || selectedTopic || selectedDifficulty || currentPage !== 1;
        setSearchTerm('');
        // setDebouncedSearchTerm(''); // This will be handled by the debounce effect clearing
        setSelectedTopic('');
        setSelectedDifficulty('');
        if (currentPage !== 1) {
            setCurrentPage(1); // Resetting page will trigger reload if needed
        } else if (needsReload) {
            loadQuestions(); // Explicitly reload if already on page 1 but filters were active
        }
        setShowFilters(false); // Optionally close filter section
    };


    // --- Memoized Values ---
    const hasActiveFiltersOrSearch = !!debouncedSearchTerm || !!selectedTopic || !!selectedDifficulty;
    const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE - 1, totalCount);

    // Pagination Buttons - (Keep existing useMemo for paginationButtons)
     const paginationButtons = useMemo(() => {
        // ... (keep existing logic for generating page buttons)
         if (totalPages <= 1) return null;
        const buttons = [];
        const maxButtonsToShow = 5; // Example: Show 5 page numbers max (e.g., ... 3 4 5 6 7 ...)
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

        // Adjust start/end if near boundaries to ensure maxButtonsToShow are displayed if possible
        if (totalPages > maxButtonsToShow) {
            if (endPage === totalPages) {
                startPage = Math.max(1, totalPages - maxButtonsToShow + 1);
            } else if (startPage === 1) {
                endPage = Math.min(totalPages, maxButtonsToShow);
            }
             // Recalculate endPage in case startPage was adjusted significantly near the beginning
             if (endPage - startPage + 1 < maxButtonsToShow && startPage > 1) {
                 startPage = Math.max(1, endPage - maxButtonsToShow + 1);
             }
        }


        // Ellipsis and first page button
        if (startPage > 1) {
            buttons.push(<button key="1" onClick={() => handlePageChange(1)} className="px-3 py-1 mx-0.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">1</button>);
            if (startPage > 2) {
                buttons.push(<span key="start-ellipsis" className="px-1 py-1 text-gray-400 text-sm">...</span>);
            }
        }

        // Page number buttons
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

        // Ellipsis and last page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(<span key="end-ellipsis" className="px-1 py-1 text-gray-400 text-sm">...</span>);
            }
            buttons.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-1 mx-0.5 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">{totalPages}</button>);
        }

        return buttons;
    }, [currentPage, totalPages, handlePageChange]); // Added handlePageChange dependency


    // --- Render ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 2500 }} />

                {/* Header */}
                <div className="mb-8 text-center animate-fadeInUp">
                     <h1 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">
                         DSA Question Bank
                     </h1>
                     <p className="text-indigo-700 font-medium">Refine your skills with targeted practice.</p>
                 </div>

                {/* Search and Filter Controls */}
                <div className="mb-6 bg-white rounded-xl shadow-lg p-5 border border-gray-200/80 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Search Input */}
                        <div className="flex-1 w-full relative">
                            <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="search" // Use type="search" for better semantics and potential browser features (like clear button)
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Search questions (e.g., Two Sum, DFS...)"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
                                aria-label="Search questions"
                            />
                        </div>

                        {/* Filter Toggle and Clear */}
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium border rounded-lg transition-all duration-150 ease-in-out shadow-sm transform hover:scale-105 ${
                                    showFilters
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-300 ring-1 ring-indigo-200' // Added ring for active state
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                                aria-expanded={showFilters} // Accessibility improvement
                            >
                                <FaFilter className="mr-2 h-4 w-4" /> Filters {showFilters ? <FaTimes className="ml-2 h-3 w-3" /> : null}
                            </button>

                            {/* Show Clear button only if filters/search are active */}
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

                    {/* Filter Options (Conditionally Rendered) */}
                    {showFilters && (
                        <div className="mt-5 pt-5 border-t border-gray-200 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                {/* Difficulty Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                       <FaList className="mr-1.5 text-gray-400"/> Difficulty
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Combine 'All' option with the defined levels */}
                                        {['', ...DIFFICULTY_LEVELS].map(level => (
                                            <button
                                                key={level || 'all-diff'} // Use unique key for 'All'
                                                onClick={() => handleDifficultySelect(level)}
                                                className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${ // Added base border
                                                    selectedDifficulty === level
                                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600' // Active state
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' // Inactive state
                                                }`}
                                                aria-pressed={selectedDifficulty === level} // Accessibility
                                            >
                                                {level || 'All'} {/* Display 'All' for the empty string value */}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Topic Filter */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaTag className="mr-1.5 text-gray-400"/> Topics
                                    </h3>
                                    {/* Added check for topics length before rendering */}
                                    {topics.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom scrollbar class if needed */}
                                            {/* 'All Topics' Button */}
                                            <button
                                                onClick={() => handleTopicSelect('')}
                                                className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${ // Added base border
                                                    selectedTopic === ''
                                                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600' // Active state
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' // Inactive state
                                                }`}
                                                aria-pressed={selectedTopic === ''} // Accessibility
                                            >
                                                All Topics
                                            </button>
                                            {/* Individual Topic Buttons */}
                                            {topics.map(topic => (
                                                <button
                                                    key={topic._id}
                                                    onClick={() => handleTopicSelect(topic.name)}
                                                    className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ease-in-out transform hover:scale-105 border ${ // Added base border
                                                        selectedTopic === topic.name
                                                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-offset-1 ring-indigo-300 border-indigo-600' // Active state
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' // Inactive state
                                                    }`}
                                                    aria-pressed={selectedTopic === topic.name} // Accessibility
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

                {/* Content Area: Loading, Error, Empty, Questions List */}
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
                             <button onClick={loadQuestions} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-200 rounded-lg hover:bg-indigo-200 transition-colors">
                                 Try Again
                             </button>
                        </div>
                    )}

                    {/* Empty State (No questions match filters/search) */}
                    {!isLoading && !error && questions.length === 0 && (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm animate-fadeIn">
                            <FaSearch className="mx-auto text-4xl mb-3 text-gray-400" />
                            <p className="font-medium text-lg">No questions found</p>
                            <p className="text-sm mb-4">
                                {hasActiveFiltersOrSearch
                                    ? "Try adjusting your search or filters."
                                    : "There are no questions yet. Add some!"}
                             </p>
                            {/* Offer to clear filters only if they are active */}
                            {hasActiveFiltersOrSearch && (
                                <button onClick={clearFiltersAndSearch} className="text-sm text-indigo-600 hover:underline font-medium">
                                    Clear filters and search
                                </button>
                            )}
                        </div>
                    )}

                    {/* Questions List */}
                    {!isLoading && !error && questions.length > 0 && (
                        questions.map((q, index) => (
                            <QuestionCard
                                key={q._id} // Use a stable key
                                q={q}
                                handleToggleStatus={handleToggleStatus}
                                handleDeleteClick={handleDeleteClick}
                                style={{ animationDelay: `${index * 40}ms` }} // Stagger animation
                            />
                        ))
                    )}
                </div>


                {/* Pagination */}
                {/* Show pagination only if there are questions and more than one page */}
                {!isLoading && !error && questions.length > 0 && totalPages > 0 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200/80">
                        <p className="text-sm text-gray-700 mb-3 sm:mb-0">
                            Showing <span className="font-semibold">{startIndex}</span>-<span className="font-semibold">{endIndex}</span> of <span className="font-semibold">{totalCount}</span> results
                        </p>

                        {/* Render pagination controls only if there's more than one page */}
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

                                {/* Page number buttons container */}
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

            </div> {/* End max-w container */}

            {/* Delete Confirmation Modal */}
            {/* (Keep existing Modal JSX) */}
              {showDeleteConfirm && (
                 <div
                     className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn"
                     onClick={handleCancelDelete} // Allow closing by clicking backdrop
                     role="dialog" // Accessibility
                     aria-modal="true"
                     aria-labelledby="delete-modal-title"
                 >
                     <div
                         className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md m-4 transform transition-all duration-300 ease-out scale-100 animate-zoomIn"
                         onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
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
                                 disabled={isDeleting} // Disable while delete is in progress
                                 className="px-6 py-2.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 transition duration-150 ease-in-out disabled:opacity-70 transform hover:scale-105"
                             >
                                 Cancel
                             </button>
                             <button
                                 onClick={handleConfirmDelete}
                                 disabled={isDeleting} // Prevent multiple clicks
                                 className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-wait transform hover:scale-105 flex items-center justify-center" // Added flex for spinner alignment
                             >
                                 {isDeleting ? <FaSpinner className="animate-spin h-4 w-4 inline mr-1.5" /> : null}
                                 {isDeleting ? 'Deleting...' : 'Delete'}
                             </button>
                         </div>
                     </div>
                 </div>
             )}


            {/* Add Keyframes for Animations (Keep existing style tag) */}
            <style jsx global>{`
                /* Scrollbar utility (optional) */
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

                /* Animations */
                 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                 .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

                 @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                 .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }

                 @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                 .animate-zoomIn { animation: zoomIn 0.3s ease-out forwards; }
            `}</style>
        </div> // End Page wrapper
    );
}

export default QuestionListPage;