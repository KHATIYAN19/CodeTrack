import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    FaAngleRight, FaSpinner, FaExclamationTriangle, FaTag, FaPencilAlt,
    FaTrashAlt, FaCheck, FaTimes
} from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

const fetchTopicsAPI = async () => {
    return axios.get(`${API_BASE_URL}/topics`);
};

const editTopicAPI = async (id, name) => {
    return axios.patch(`${API_BASE_URL}/topics/${id}`, { name });
};

const deleteTopicAPI = async (id) => {
    return axios.delete(`${API_BASE_URL}/topics/${id}`);
};

const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};


function TopicListPage() {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingTopicId, setEditingTopicId] = useState(null);
    const [editInputValue, setEditInputValue] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const editInputRef = useRef(null);

    const loadTopics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchTopicsAPI();
            if (response.data?.success && Array.isArray(response.data.data)) {
                const sortedTopics = response.data.data.sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '')
                );
                setTopics(sortedTopics);
            } else {
                setTopics([]);
                throw new Error(response.data?.message || "Invalid data structure for topics.");
            }
        } catch (err) {
            console.error("Failed to fetch topics:", err);
            setError(err.response?.data?.error || err.message || "Could not load topics.");
            setTopics([]);
            toast.error("Failed to load topics.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTopics();
    }, [loadTopics]);

    useEffect(() => {
        if (editingTopicId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingTopicId]);


    const handleTopicClick = (topicId, topicName) => {
        if (editingTopicId === topicId || showDeleteConfirm === topicId) {
            return;
        }
        navigate(`/topics/${encodeURIComponent(topicName)}`);
    };

    const handleEditClick = (e, topic) => {
        e.stopPropagation(); // Prevent click from navigating
        setEditingTopicId(topic._id);
        setEditInputValue(topic.name);
    };

    const handleCancelEdit = () => {
        setEditingTopicId(null);
        setEditInputValue('');
    };

    const handleSaveEdit = async (e) => {
        e.stopPropagation(); // Prevent click from navigating
        if (!editInputValue || editInputValue.trim() === '') {
            toast.error("Topic name cannot be empty.");
            return;
        }
        if (!editingTopicId) return;

        const originalTopic = topics.find(t => t._id === editingTopicId);
        const trimmedNewName = editInputValue.trim();
        const formattedNewName = capitalizeWords(trimmedNewName);

        if (originalTopic && originalTopic.name === formattedNewName) {
             handleCancelEdit();
             return;
        }

        const nameExists = topics.some(t => t._id !== editingTopicId && t.name.toLowerCase() === formattedNewName.toLowerCase());
        if (nameExists) {
            toast.error(`Another topic named "${formattedNewName}" already exists.`);
            return;
        }

        setIsSubmittingEdit(true);
        const toastId = toast.loading(`Updating topic...`);

        try {
            const response = await editTopicAPI(editingTopicId, formattedNewName);
            if (response.data?.success) {
                setTopics(prevTopics =>
                    prevTopics.map(t =>
                        t._id === editingTopicId ? { ...t, name: response.data.data.name } : t
                    ).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                );
                toast.success(`Topic updated!`, { id: toastId });
                handleCancelEdit();
            } else {
                 throw new Error(response.data?.error || "Update failed.");
            }
        } catch (err) {
            console.error("Failed to edit topic:", err);
            const errorMessage = err.response?.data?.error || "Failed to update topic.";
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleDeleteClick = (e, topicId) => {
        e.stopPropagation(); // Prevent click from navigating
        setShowDeleteConfirm(topicId);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    const handleConfirmDelete = async () => {
        if (!showDeleteConfirm) return;

        setIsDeleting(true);
        const topicToDelete = topics.find(t => t._id === showDeleteConfirm);
        const toastId = toast.loading(`Deleting topic "${topicToDelete?.name || '...'}"...`);

        try {
            await deleteTopicAPI(showDeleteConfirm);
            setTopics(prevTopics => prevTopics.filter(t => t._id !== showDeleteConfirm));
            toast.success(`Topic "${topicToDelete?.name || ''}" deleted.`, { id: toastId });
        } catch (err) {
            console.error("Failed to delete topic:", err);
             const errorMessage = err.response?.data?.error || "Failed to delete topic.";
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsDeleting(false);
            handleCancelDelete(); // Close modal regardless of success or error
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />

            <h1 className="text-3xl font-bold text-center text-slate-800 mb-10 animate-fadeInUp">
                Manage Topics
            </h1>

            {isLoading ? (
                <div className="flex justify-center items-center p-10 text-slate-600">
                    <FaSpinner className="animate-spin text-indigo-600 text-3xl mr-3" />
                    Loading Topics...
                </div>
            ) : error ? (
                <div className="p-6 text-center text-red-600 bg-red-100 border border-red-300 rounded-lg shadow-sm animate-fadeIn">
                    <FaExclamationTriangle className="inline-block mr-2 text-xl" />
                    Error loading topics: {error}
                </div>
            ) : topics.length === 0 ? (
                <p className="p-6 text-center text-slate-500 bg-white rounded-lg shadow border animate-fadeIn">
                    No topics found. Add some topics first!
                </p>
            ) : (
                <div className="max-w-3xl mx-auto space-y-3">
                    {topics.map((topic, index) => (
                        <div
                            key={topic._id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className={`flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 ease-in-out group relative animate-fadeInUp ${editingTopicId === topic._id ? 'ring-2 ring-indigo-400 ring-offset-1' : 'hover:shadow-lg hover:border-indigo-300 hover:scale-[1.01]'}`}
                        >
                            {editingTopicId === topic._id ? (
                                <>
                                    <FaTag className="mr-3 text-indigo-500 flex-shrink-0" />
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editInputValue}
                                        onChange={(e) => setEditInputValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(e); if (e.key === 'Escape') handleCancelEdit(); }}
                                        className="flex-grow text-lg font-medium text-slate-700 border-b-2 border-indigo-300 focus:border-indigo-500 outline-none px-1 py-0.5 mr-2 transition-colors bg-transparent"
                                        disabled={isSubmittingEdit}
                                    />
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={isSubmittingEdit || !editInputValue.trim() || (topics.find(t => t._id === editingTopicId)?.name === capitalizeWords(editInputValue.trim()))}
                                            className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out transform hover:scale-110"
                                            title="Save changes"
                                        >
                                            {isSubmittingEdit ? <FaSpinner className="animate-spin h-4 w-4" /> : <FaCheck className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isSubmittingEdit}
                                            className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50 transition-all duration-150 ease-in-out transform hover:scale-110"
                                            title="Cancel edit"
                                        >
                                            <FaTimes className="h-4 w-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div
                                        className="flex items-center flex-grow cursor-pointer min-w-0 mr-4 group/topicname"
                                        onClick={() => handleTopicClick(topic._id, topic.name)}
                                        title={`View questions for ${topic.name}`}
                                    >
                                        <FaTag className="mr-3 text-indigo-500 group-hover/topicname:text-indigo-600 transition-colors" />
                                        <span className="text-lg font-medium text-slate-700 truncate group-hover/topicname:text-indigo-700 transition-colors">
                                            {topic.name}
                                        </span>
                                        <FaAngleRight className="ml-2 text-slate-400 opacity-0 group-hover/topicname:opacity-100 group-hover/topicname:translate-x-1 transition-all duration-200 ease-in-out" size={16} />
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleEditClick(e, topic)}
                                            className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 transition-all duration-150 ease-in-out transform hover:scale-110"
                                            title="Edit topic name"
                                        >
                                            <FaPencilAlt className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, topic._id)}
                                            className="p-1.5 rounded-full text-red-600 hover:bg-red-100 transition-all duration-150 ease-in-out transform hover:scale-110"
                                            title="Delete topic"
                                        >
                                            <FaTrashAlt className="h-4 w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fadeIn"
                    onClick={handleCancelDelete}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl p-7 w-full max-w-md m-4 transform transition-all duration-300 ease-out scale-100 animate-zoomIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center mb-4">
                             <div className="p-3 rounded-full bg-red-100 text-red-600">
                                 <FaExclamationTriangle className="h-6 w-6" />
                             </div>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-3 text-center">Confirm Deletion</h3>
                        <p className="text-sm text-slate-600 mb-6 text-center px-4">
                            Are you sure you want to delete the topic <br/>
                            <strong className="text-slate-700 text-base">"{topics.find(t => t._id === showDeleteConfirm)?.name}"</strong>?
                            <br/> This will also delete associated questions. This action cannot be undone.
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
                                className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-wait transform hover:scale-105"
                            >
                                {isDeleting ? <FaSpinner className="animate-spin h-4 w-4 inline mr-1.5" /> : null}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }

                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp { animation: fadeInUp 0.4s ease-out forwards; }

                 @keyframes zoomIn {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-zoomIn { animation: zoomIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}

export default TopicListPage;