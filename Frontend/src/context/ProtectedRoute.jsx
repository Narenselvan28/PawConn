import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx'; // Correctly import the hook

/**
 * ProtectedRoute Component
 * Wraps elements that should only be rendered when the user is authenticated.
 */
const ProtectedRoute = ({ children }) => {
    // Access authentication state globally
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        // If not authenticated, instantly redirect the user to the login page.
        // The 'replace' prop ensures the user cannot press the back button to bypass the login.
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child components (the actual requested page).
    return children;
};

export default ProtectedRoute;
