// src/components/AddQuestionForm.jsx
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaPlus, FaSpinner, FaExclamationCircle, FaTag, FaLink, FaCheck, FaListAlt, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';

// --- API Call Setup (Remains the same) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

const fetchTopicsAPI = async () => {
    return axios.get(`${API_BASE_URL}/topics`);
};

const addQuestionAPI = async (questionData) => {
    // Payload remains the same structure
    const payload = {
        topic: questionData.topic,
        questionName: questionData.questionName,
        link: questionData.link,
        difficulty: questionData.difficulty,
    };
    return axios.post(`${API_BASE_URL}/questions`, payload, {
        headers: { 'Content-Type': 'application/json' }
    });
};

// --- Difficulty Levels ---
const difficultyLevels = ['Easy', 'Medium', 'Hard'];

function AddQuestionForm() {
    // --- State Variables ---
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [topicError, setTopicError] = useState('');

    // Form field states
    const [topic, setTopic] = useState('');
    const [questionName, setQuestionName] = useState('');
    const [link, setLink] = useState('');
    const [difficulty, setDifficulty] = useState('');

    // Form validation errors state
    const [errors, setErrors] = useState({});

    // Submission loading state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Topics Effect (Remains similar) ---
    useEffect(() => {
        const loadTopics = async () => {
            setLoadingTopics(true);
            setTopicError('');
            const loadingToastId = toast.loading('Loading topics...');
            try {
                const response = await fetchTopicsAPI();
                toast.dismiss(loadingToastId);
                if (response.data?.success && Array.isArray(response.data.data)) {
                    setTopics(response.data.data);
                    if (response.data.data.length === 0) {
                        setTopicError('No topics found. Add topics via the admin panel.');
                    }
                } else {
                    setTopics([]);
                    setTopicError('Could not load topics structure.');
                    toast.error('Error loading topics.');
                }
            } catch (error) {
                toast.dismiss(loadingToastId);
                console.error('Failed to fetch topics:', error);
                const message = error.response?.data?.error || 'Network error or server unavailable.';
                setTopicError(`Failed to fetch topics: ${message}`);
                toast.error('Failed to fetch topics.');
                setTopics([]);
            } finally {
                setLoadingTopics(false);
            }
        };
        loadTopics();
    }, []);

    // --- Form Reset Function ---
    const resetForm = () => {
        setTopic('');
        setQuestionName('');
        setLink('');
        setDifficulty('');
        setErrors({});
    };

    // --- Validation Function ---
    const validateForm = () => {
        const newErrors = {};

        if (!topic) {
            newErrors.topic = 'Please select a topic';
        }
        if (!questionName.trim()) {
            newErrors.questionName = 'Question title cannot be empty';
        } else if (questionName.trim().length < 5) {
            newErrors.questionName = 'Question title must be at least 5 characters';
        }
        if (!link.trim()) {
            newErrors.link = 'Link cannot be empty';
        } else {
            // Basic URL validation (can be improved with regex if needed)
            try {
                new URL(link.trim());
            } catch (_) {
                newErrors.link = 'Please enter a valid URL (e.g., https://...)';
            }
        }
        if (!difficulty) {
            newErrors.difficulty = 'Please select a difficulty level';
        }

        setErrors(newErrors);
        // Return true if no errors, false otherwise
        return Object.keys(newErrors).length === 0;
    };

    // --- Form Submission Handler ---
    const handleFormSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission

        if (!validateForm()) {
            toast.error('Please fix the errors in the form.');
            return; // Stop submission if validation fails
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Submitting question...');

        const formData = {
            topic,
            questionName: questionName.trim(),
            link: link.trim(),
            difficulty
        };

        try {
            await addQuestionAPI(formData);
            toast.success(`Question "${formData.questionName}" added!`, { id: toastId, duration: 4000 });
            resetForm(); // Reset form fields on success
        } catch (error) {
            console.error('Failed to add question:', error);
            const errorMessage = error.response?.data?.error || 'Failed to add question. Check connection or server logs.';
            toast.error(errorMessage, { id: toastId, duration: 5000 });
        } finally {
            setIsSubmitting(false); // Ensure loading state is turned off
        }
    };

    // --- Helper to get border color based on error state ---
    const getBorderColor = (fieldName) => {
      return errors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
    };

    // --- Render Logic ---
    return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-gradient-to-br from-gray-50 via-white to-indigo-100 rounded-xl shadow-lg border border-gray-200">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'text-sm' }}/>
            <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
                <FaPlus className="inline-block mr-3 text-indigo-600" />
                Add a New Question
            </h2>

            {/* Use standard form tag with manual onSubmit */}
            <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>

                {/* --- Topic Selection --- */}
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                       <FaListAlt className="mr-2 text-gray-500" /> Topic <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                        id="topic"
                        value={topic} // Control component with state
                        onChange={(e) => {
                            setTopic(e.target.value);
                            // Clear error when user interacts
                            if (errors.topic) setErrors(prev => ({ ...prev, topic: null }));
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white text-gray-700
                                    focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out
                                    ${getBorderColor('topic')}
                                    ${loadingTopics || topicError || topics.length === 0 ? 'opacity-70 bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting || loadingTopics || topics.length === 0}
                        aria-invalid={!!errors.topic} // Use !! to convert error message to boolean
                    >
                        <option value="" disabled className="text-gray-400">
                            {loadingTopics ? 'Loading topics...' : topics.length === 0 ? 'No topics available' : '-- Select Topic --'}
                        </option>
                        {topics.map((t) => (
                            <option key={t._id || t.name} value={t.name}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                    {topicError && !loadingTopics && (
                        <p role="alert" className="mt-1.5 text-xs text-red-600 flex items-center">
                            <FaExclamationCircle className="mr-1 flex-shrink-0"/> {topicError}
                        </p>
                    )}
                    {/* Display manual validation error */}
                    {errors.topic && (
                        <p role="alert" className="mt-1.5 text-xs text-red-600">{errors.topic}</p>
                    )}
                </div>

                {/* --- Question Name Input --- */}
                <div>
                    <label htmlFor="questionName" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                       <FaTag className="mr-2 text-gray-500" /> Question Title <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        id="questionName"
                        type="text"
                        value={questionName} // Control component with state
                        onChange={(e) => {
                            setQuestionName(e.target.value);
                            // Clear error when user interacts
                            if (errors.questionName) setErrors(prev => ({ ...prev, questionName: null }));
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white
                                    focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out
                                    ${getBorderColor('questionName')}`}
                        placeholder="e.g., Find Duplicate Subtrees"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.questionName}
                    />
                     {/* Display manual validation error */}
                    {errors.questionName && (
                        <p role="alert" className="mt-1.5 text-xs text-red-600">{errors.questionName}</p>
                    )}
                </div>

                {/* --- Link Input --- */}
                <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                       <FaLink className="mr-2 text-gray-500" /> Question Link <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        id="link"
                        type="url" // Keep type="url" for browser hints
                        value={link} // Control component with state
                        onChange={(e) => {
                            setLink(e.target.value);
                             // Clear error when user interacts
                             if (errors.link) setErrors(prev => ({ ...prev, link: null }));
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white
                                    focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out
                                    ${getBorderColor('link')}`}
                        placeholder="https://leetcode.com/problems/..."
                        disabled={isSubmitting}
                        aria-invalid={!!errors.link}
                    />
                    {/* Display manual validation error */}
                     {errors.link && (
                        <p role="alert" className="mt-1.5 text-xs text-red-600">{errors.link}</p>
                    )}
                </div>

                {/* --- Difficulty Radio Buttons --- */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        Difficulty <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {difficultyLevels.map((level) => (
                            <label key={level} className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="radio"
                                    value={level}
                                    name="difficulty" // Group radio buttons
                                    checked={difficulty === level} // Control checked state
                                    onChange={(e) => {
                                        setDifficulty(e.target.value);
                                        // Clear error when user interacts
                                        if (errors.difficulty) setErrors(prev => ({ ...prev, difficulty: null }));
                                    }}
                                    className="focus:ring-indigo-500 focus:ring-offset-1 h-4 w-4 text-indigo-600 border-gray-400 transition duration-150 ease-in-out cursor-pointer"
                                    disabled={isSubmitting}
                                    aria-invalid={!!errors.difficulty}
                                />
                                <span className={`text-sm font-medium transition-colors ${errors.difficulty ? 'text-red-600' : 'text-gray-700 group-hover:text-indigo-700'}`}>{level}</span>
                            </label>
                        ))}
                    </div>
                     {/* Display manual validation error */}
                    {errors.difficulty && (
                        <p role="alert" className="mt-1.5 text-xs text-red-600">{errors.difficulty}</p>
                    )}
                </div>

                {/* --- Submit Button --- */}
                <button
                    type="submit"
                    // Disable only when submitting or topics unavailable
                    disabled={isSubmitting || loadingTopics || topics.length === 0}
                    className={`w-full flex justify-center items-center px-6 py-3 mt-4 border border-transparent rounded-lg shadow-sm
                                text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-700
                                hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-purple-700
                                transition-all duration-200 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]`}
                >
                    {isSubmitting ? (
                        <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                        <FaPaperPlane className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Add Question'}
                </button>
            </form>
        </div>
    );
}

export default AddQuestionForm;