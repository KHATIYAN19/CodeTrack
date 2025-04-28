import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { z } from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import { FaEdit, FaTrashAlt, FaCalendarAlt, FaInfoCircle, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { format, parseISO, isFuture, isPast, addYears, formatDistanceToNow, isValid } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://codetrack-backend-qfbz.onrender.com';

const isValidDateTimeString = (value) => {
    try {
        const date = new Date(value);
        return isValid(date);
    } catch {
        return false;
    }
};

const taskSchema = z.object({
  heading: z.string().min(3, { message: 'Heading must be at least 3 characters long' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters long' }),
  time: z.string()
    .refine(isValidDateTimeString, { message: 'Invalid date/time format selected' })
    .refine(value => {
        const date = new Date(value);
        return isFuture(date);
    }, { message: 'Deadline must be in the future' })
    .refine(value => {
        const date = new Date(value);
        const oneYearFromNow = addYears(new Date(), 1);
        return date < oneYearFromNow;
    }, { message: 'Deadline must be within one year from now' }),
});

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for disabling buttons
  const [isUpdating, setIsUpdating] = useState(false); // State for disabling update button
  const [formData, setFormData] = useState({ heading: '', content: '', time: '' });
  const [errors, setErrors] = useState({});
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({ heading: '', content: '', time: '' });
  const [updateErrors, setUpdateErrors] = useState({});

  const formatDateTimeLocal = (dateInput) => {
    if (!dateInput) return '';
    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return '';
        return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
        return '';
    }
  };

  const formatTimeRemaining = (taskIsoTime) => {
    if (!taskIsoTime) return <span className="text-gray-500">No deadline</span>;
    try {
        const taskDate = parseISO(taskIsoTime);
        if (!isValid(taskDate)) return <span className="text-orange-600">Invalid Date</span>;
        if (isPast(taskDate)) {
            return <span className="text-red-600 font-medium">Deadline Passed</span>;
        }
        return <span className="text-green-700">{formatDistanceToNow(taskDate, { addSuffix: true })}</span>;
    } catch {
         return <span className="text-orange-600">Error calculating time</span>;
    }
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading('Fetching tasks...');
    try {
      const res = await axios.get(`${API_BASE_URL}/tasks`); 

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setTasks(res.data.data); 
        toast.success(res.data.message || 'Tasks loaded successfully!', { id: toastId });
      } else {
        console.error('Unexpected response format:', res.data);
        toast.error('Failed to load tasks: Unexpected format.', { id: toastId });
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      const message = error.response?.data?.message || error.message || 'An unknown error occurred';
      toast.error(`Error fetching tasks: ${message}.`, { id: toastId });
      setTasks([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleInputChange = (e, formSetter, errorSetter, currentErrors) => {
    const { name, value } = e.target;
    formSetter((prev) => ({ ...prev, [name]: value }));
    if (currentErrors[name]) {
      errorSetter((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = (data, schema, errorSetter) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const newErrors = result.error.flatten().fieldErrors;
      errorSetter(newErrors);
      toast.error('Please fix the errors in the form.');
      return false;
    }
    errorSetter({});
    return true;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData, taskSchema, setErrors)) return;

    setIsSubmitting(true); 
    const dataToSend = {
        ...formData,
        time: new Date(formData.time).toISOString()
    };

    const toastId = toast.loading('Creating task...');
    try {
        const res = await axios.post(`${API_BASE_URL}/tasks`, dataToSend); 

        if (res.data && res.data.success && res.data.data) {
            const newTask = res.data.data;
            setTasks((prev) => [newTask, ...prev]);
            setFormData({ heading: '', content: '', time: '' });
            setErrors({});
            toast.success(res.data.message || 'Task created successfully!', { id: toastId });
        } else {
            console.error("Create task response error:", res.data);
            toast.error(res.data?.message || 'Failed to create task: Unexpected response.', { id: toastId });
        }
    } catch (err) {
        console.error('Error creating task:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create task.';
        if (err.response?.data?.errors) {
           const backendErrors = Object.entries(err.response.data.errors).reduce((acc, [key, value]) => {
              acc[key] = Array.isArray(value) ? value : [value];
              return acc;
           }, {});
           setErrors(backendErrors);
        }
        toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
        setIsSubmitting(false); // Re-enable button
    }
  };


  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateFormData({
      heading: task.heading,
      content: task.content,
      time: formatDateTimeLocal(task.time),
    });
    setUpdateErrors({});
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedTask(null);
  };

  const openDeleteModal = (task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask || !validateForm(updateFormData, taskSchema, setUpdateErrors)) return;

    setIsUpdating(true); // Disable button
    const dataToSend = {
        ...updateFormData,
        time: new Date(updateFormData.time).toISOString()
    };

    const toastId = toast.loading('Updating task...');
    try {
        const res = await axios.put(`${API_BASE_URL}/tasks/${selectedTask._id}`, dataToSend); 

        if (res.data && res.data.success) {
             const updatedTask = { 
                  ...selectedTask,
                  ...dataToSend
              };
            setTasks((prev) =>
              prev.map((task) => (task._id === selectedTask._id ? updatedTask : task))
            );
            closeUpdateModal();
            toast.success(res.data.message || 'Task updated successfully!', { id: toastId });
        } else {
             console.error("Update task response error:", res.data);
             toast.error(res.data?.message || 'Failed to update task: Unexpected response.', { id: toastId });
        }
    } catch (err) {
        console.error('Error updating task:', err);
         const errorMessage = err.response?.data?.message || err.message || 'Failed to update task.';
         if (err.response?.data?.errors) {
           const backendErrors = Object.entries(err.response.data.errors).reduce((acc, [key, value]) => {
              acc[key] = Array.isArray(value) ? value : [value];
              return acc;
           }, {});
           setUpdateErrors(backendErrors);
         }
         toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
        setIsUpdating(false); 
    }
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;

    const deletePromise = axios.delete(`${API_BASE_URL}/tasks/${selectedTask._id}`); 
    toast.promise(
      deletePromise,
      {
        loading: 'Deleting task...',
        success: (res) => { // Check response if needed
          setTasks((prev) => prev.filter(task => task._id !== selectedTask._id));
          closeDeleteModal();
          return res.data?.message || 'Task deleted successfully!';
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          const errorMessage = err.response?.data?.message || err.message || 'Failed to delete task.';
          closeDeleteModal();
          return `Error: ${errorMessage}`;
        },
      }
    );
  };

  const renderError = (fieldErrors) => {
    if (!fieldErrors || fieldErrors.length === 0) return null;
    return <p className="mt-1 text-sm text-red-600 flex items-center"><FaInfoCircle className="mr-1 flex-shrink-0"/> {fieldErrors[0]}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex flex-col items-center">
      <Toaster position="top-right" reverseOrder={false} containerClassName="mt-4 mr-4"/>

      <div className="w-full max-w-3xl">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 border-b pb-3">Create New Task</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label htmlFor="heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
              <input
                type="text"
                id="heading"
                name="heading"
                value={formData.heading}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                placeholder="e.g., Project Proposal Deadline"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none transition duration-150 ease-in-out"
                disabled={isSubmitting} // Disable input during submission
              />
              {renderError(errors.heading)}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                placeholder="Describe the task details..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none transition duration-150 ease-in-out"
                disabled={isSubmitting} // Disable input during submission
              />
               {renderError(errors.content)}
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
               <div className="relative">
                  <input
                    type="datetime-local"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange(e, setFormData, setErrors, errors)}
                    min={formatDateTimeLocal(new Date())}
                    max={formatDateTimeLocal(addYears(new Date(), 1))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none transition duration-150 ease-in-out appearance-none"
                    disabled={isSubmitting} // Disable input during submission
                  />
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
               {renderError(errors.time)}
            </div>

            <button
              type="submit"
              disabled={isSubmitting} // Disable button when submitting
              className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out transform hover:scale-105 active:scale-100 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isSubmitting ? (
                  <FaSpinner className="animate-spin mr-2" /> // Show spinner when submitting
              ) : (
                 'Add Task'
              )}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Tasks</h2>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
              No tasks found. Add one using the form!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white p-5 rounded-xl shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 break-words flex-grow">{task.heading}</h3>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => openUpdateModal(task)}
                        className="text-blue-500 hover:text-blue-700 transition-colors duration-150 p-1 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label="Edit Task"
                        title="Edit Task"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(task)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="Delete Task"
                        title="Delete Task"
                      >
                        <FaTrashAlt size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 break-words">{task.content}</p>
                  <div className="text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100 space-y-1">
                     {task.email && <p><strong>Email:</strong> {task.email}</p>}
                     <p><strong>Deadline:</strong> {task.time && isValid(parseISO(task.time)) ? format(parseISO(task.time), 'PPpp') : 'N/A'}</p>
                     <p><strong>Status:</strong> {formatTimeRemaining(task.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

       <Modal isOpen={isUpdateModalOpen} onClose={closeUpdateModal} title="Update Task">
             <form onSubmit={handleUpdateSubmit} className="space-y-4">
               <div>
                 <label htmlFor="update-heading" className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
                 <input
                   type="text"
                   id="update-heading"
                   name="heading"
                   value={updateFormData.heading}
                   onChange={(e) => handleInputChange(e, setUpdateFormData, setUpdateErrors, updateErrors)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none"
                   disabled={isUpdating} // Disable during update
                 />
                 {renderError(updateErrors.heading)}
               </div>
               <div>
                 <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                 <textarea
                   id="update-content"
                   name="content"
                   value={updateFormData.content}
                   onChange={(e) => handleInputChange(e, setUpdateFormData, setUpdateErrors, updateErrors)}
                   rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none"
                    disabled={isUpdating} // Disable during update
                 />
                 {renderError(updateErrors.content)}
               </div>
               <div>
                 <label htmlFor="update-time" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                 <div className="relative">
                    <input
                      type="datetime-local"
                      id="update-time"
                      name="time"
                      value={updateFormData.time}
                      onChange={(e) => handleInputChange(e, setUpdateFormData, setUpdateErrors, updateErrors)}
                      min={formatDateTimeLocal(new Date())}
                      max={formatDateTimeLocal(addYears(new Date(), 1))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:outline-none appearance-none"
                      disabled={isUpdating} // Disable during update
                    />
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
                 {renderError(updateErrors.time)}
               </div>
               <div className="flex justify-end space-x-3 pt-4">
                 <button
                    type="button"
                    onClick={closeUpdateModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={isUpdating} // Also disable cancel during update
                 >
                    Cancel
                 </button>
                 <button
                    type="submit"
                    disabled={isUpdating} // Disable button when updating
                    className="px-4 py-2 w-28 flex justify-center items-center bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {isUpdating ? <FaSpinner className="animate-spin" /> : 'Update Task'}
                 </button>
               </div>
             </form>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Confirm Deletion">
            {selectedTask && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete the task: <strong className="font-medium text-gray-800">{selectedTask.heading}</strong>?
                    </p>
                    <p className="text-sm text-red-600">This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={closeDeleteModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
                        <button onClick={confirmDeleteTask} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
                    </div>
                </div>
            )}
        </Modal>

    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto z-50 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors duration-150 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
      <style jsx global>{`
        @keyframes modal-fade-in {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-fade-in {
          animation: modal-fade-in 0.3s forwards;
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
