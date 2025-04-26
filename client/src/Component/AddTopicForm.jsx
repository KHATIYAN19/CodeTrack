// src/components/AddTopicForm.jsx
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaPlusCircle, FaSpinner, FaTag } from 'react-icons/fa'; // Icons for input and button
import axios from 'axios'; // Assuming you have axios configured

// --- API Call Setup ---
// Adjust the base URL and endpoint as needed for your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://codetrack-backend-qfbz.onrender.com';

const addTopicAPI = async (topicData) => {
    // The backend expects an object, e.g., { name: 'topicName' }
    return axios.post(`${API_BASE_URL}/topics`, topicData, {
        headers: { 'Content-Type': 'application/json' }
    });
};

function AddTopicForm() {
    // --- State Variables ---
    const [topicName, setTopicName] = useState(''); // State for the topic name input
    const [error, setError] = useState('');      // State for validation error message
    const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading

    // --- Validation Function ---
    const validateForm = () => {
        let isValid = true;
        setError(''); // Clear previous error

        if (!topicName.trim()) {
            setError('Topic name cannot be empty.');
            isValid = false;
        } else if (topicName.trim().length < 3) { // Example: Minimum length validation
            setError('Topic name must be at least 3 characters long.');
            isValid = false;
        } else if (topicName.trim().length > 100) { // Example: Maximum length validation
             setError('Topic name cannot exceed 100 characters.');
             isValid = false;
        }

        return isValid;
    };

    // --- Form Submission Handler ---
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        if (!validateForm()) {
            // Validation failed, error state is already set
            toast.error(error || "Please fix the errors."); // Show toast if error state was set
            return;
        }

        setIsSubmitting(true); // Set loading state
        const toastId = toast.loading('Adding topic...');

        try {
            // Call the API function
            await addTopicAPI({ name: topicName.trim() }); // Send topic name in the expected format

            toast.success(`Topic "${topicName.trim()}" added successfully!`, { id: toastId });
            setTopicName(''); // Clear the input field on success
            setError('');     // Clear any previous errors

            // Optional: Add logic here to refresh a list of topics if displayed elsewhere
            // e.g., call a function passed via props: props.onTopicAdded();

        } catch (err) {
            console.error('Failed to add topic:', err);
            // Display specific error from backend if available, otherwise generic message
            const errorMessage = err.response?.data?.error || 'Failed to add topic. Please try again.';
            toast.error(errorMessage, { id: toastId });
            // Do not clear the form on error, allow user to retry
        } finally {
            setIsSubmitting(false); // Reset loading state regardless of success or failure
        }
    };

    // --- Render Logic ---
    return (
        // Container with styling similar to AddQuestionForm
        <div className="max-w-lg mx-auto my-10 p-8 bg-gradient-to-br from-teal-50 via-white to-cyan-100 rounded-xl shadow-lg border border-gray-200">
            {/* Toaster component is needed to display the toasts */}
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'text-sm' }} />

            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                <FaPlusCircle className="inline-block mr-2 text-cyan-600" />
                Add New Topic
            </h2>

            {/* Form element with onSubmit handler */}
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* --- Topic Name Input --- */}
                <div>
                    <label htmlFor="topicName" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <FaTag className="mr-2 text-gray-500" /> Topic Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        id="topicName"
                        type="text"
                        value={topicName} // Controlled input
                        onChange={(e) => {
                            setTopicName(e.target.value);
                            // Clear error message when user starts typing
                            if (error) setError('');
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white
                                    focus:outline-none focus:ring-2 focus:ring-offset-1 transition duration-150 ease-in-out
                                    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-cyan-500 focus:ring-cyan-500'}`}
                        placeholder="e.g., Arrays, Dynamic Programming, System Design"
                        disabled={isSubmitting} // Disable input during submission
                        aria-invalid={!!error} // Indicate invalid state for accessibility
                        aria-describedby={error ? "topicName-error" : undefined} // Link error message
                    />
                    {/* Display validation error message */}
                    {error && (
                        <p id="topicName-error" role="alert" className="mt-1.5 text-xs text-red-600">
                            {error}
                        </p>
                    )}
                </div>

                {/* --- Submit Button --- */}
                <button
                    type="submit"
                    disabled={isSubmitting} // Disable button during submission
                    className={`w-full flex justify-center items-center px-6 py-3 mt-2 border border-transparent rounded-lg shadow-sm
                                text-base font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-600
                                hover:from-cyan-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500
                                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-teal-600
                                transition-all duration-200 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]`}
                >
                    {/* Show spinner when submitting, otherwise show icon */}
                    {isSubmitting ? (
                        <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                    ) : (
                        <FaPlusCircle className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting ? 'Adding Topic...' : 'Add Topic'}
                </button>
            </form>
        </div>
    );
}

export default AddTopicForm;
