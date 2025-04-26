// src/components/Navbar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaListAlt, FaQuestionCircle, FaPlusCircle, FaBars, FaTimes, FaCode } from 'react-icons/fa'; // Import icons

function Navbar() {
    // State for mobile menu visibility
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Helper function to define NavLink classes (including active state)
    const getNavLinkClass = ({ isActive }) => {
        const baseClasses = "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
        const activeClasses = "bg-indigo-700 text-white"; // Style for the active link
        const inactiveClasses = "text-gray-300 hover:bg-indigo-500 hover:text-white"; // Style for inactive links
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

     // Helper function for mobile NavLink classes
    const getMobileNavLinkClass = ({ isActive }) => {
        const baseClasses = "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out";
        const activeClasses = "bg-indigo-700 text-white";
        const inactiveClasses = "text-gray-300 hover:bg-indigo-500 hover:text-white";
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };


    return (
        // Navbar container with gradient background, padding, and shadow
        <nav className="bg-gradient-to-r from-indigo-600 to-purple-700 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Brand/Logo */}
                    <div className="flex-shrink-0 flex items-center">
                         {/* Example Logo/Brand - Replace with your actual logo or text */}
                         <NavLink to="/" className="flex items-center text-white hover:text-indigo-200 transition-colors">
                             <FaCode className="h-8 w-8 mr-2 text-indigo-300" />
                             <span className="font-bold text-xl tracking-tight">CodeTrack</span>
                         </NavLink>
                    </div>

                    {/* Right side: Desktop Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/topics" className={getNavLinkClass}>
                                <FaListAlt className="mr-1.5 h-4 w-4" /> Topics
                            </NavLink>
                            {/* Renamed "Problems" to "All Questions", linking to /questions */}
                            <NavLink to="/problems" className={getNavLinkClass}>
                                <FaQuestionCircle className="mr-1.5 h-4 w-4" /> Problems
                            </NavLink>
                            {/* Assuming routes /add-topic and /add-question exist */}
                            <NavLink to="/add-topic" className={getNavLinkClass}>
                                <FaPlusCircle className="mr-1.5 h-4 w-4" /> Add Topic
                            </NavLink>
                            <NavLink to="/add-question" className={getNavLinkClass}>
                                <FaPlusCircle className="mr-1.5 h-4 w-4" /> Add Question
                            </NavLink>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            type="button"
                            className="bg-indigo-600 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-all"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <FaTimes className="block h-6 w-6" aria-hidden="true" /> // Close icon
                            ) : (
                                <FaBars className="block h-6 w-6" aria-hidden="true" /> // Menu icon
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {/* Use transition classes for smooth opening/closing */}
            <div
                className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`}
                id="mobile-menu"
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                     <NavLink to="/topics" className={getMobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                        <FaListAlt className="mr-2 h-5 w-5 inline-block" /> Topics
                    </NavLink>
                    <NavLink to="/questions" className={getMobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                        <FaQuestionCircle className="mr-2 h-5 w-5 inline-block" /> All Questions
                    </NavLink>
                    <NavLink to="/add-topic" className={getMobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                        <FaPlusCircle className="mr-2 h-5 w-5 inline-block" /> Add Topic
                    </NavLink>
                    <NavLink to="/add-question" className={getMobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                        <FaPlusCircle className="mr-2 h-5 w-5 inline-block" /> Add Question
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
