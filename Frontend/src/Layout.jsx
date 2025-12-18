import React from 'react';
import Navbar from './component/basic components/Navbar.jsx'; 
import { useAuth } from './context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
    // Access global authentication state
    const { isAuthenticated, userRole, userId, logout } = useAuth();
    const navigate = useNavigate();

    // Handler to clear global state and redirect on logout
    const handleLogout = () => {
        logout(); // Clear global state (updates isAuthenticated to false)
        navigate('/'); // Redirect to homepage
    };
    
    // Handler for navigation to the login page
    const handleLogin = () => {
        navigate('/login');
    };

    // Handler for navigating to the adoption gallery
    const handleAdoptNavigate = () => {
        navigate('/adoption-gallery');
    };

    // Handler for reporting an incident
    const handleReportIncident = () => {
        // Navigate to the IncidentReporter route
        navigate('/Incidents');
    };


    // Props object passed to the Navbar component
    const navProps = {
        isAuthenticated: isAuthenticated,
        userRole: userRole,
        onLogout: handleLogout,
        onLogin: handleLogin,
        onAdoptNavigate: handleAdoptNavigate,
        onReportIncident: handleReportIncident,
        // userId is available globally via useAuth() for children components
    };

    return (
        <>
            {/* The Navbar component receives authentication state and navigation handlers */}
            <Navbar {...navProps} /> 
            
            <main className="flex-grow">
                {children}
            </main>
        </>
    );
};

export default Layout;
