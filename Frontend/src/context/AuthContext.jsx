import React, { createContext, useState, useContext, useCallback } from 'react';

// Create the Context object
const AuthContext = createContext(null);

// Custom hook for consuming the Auth Context
export const useAuth = () => useContext(AuthContext);

/**
 * Auth Provider Component
 * Manages global authentication state, token, and user identity.
 */
export const AuthProvider = ({ children }) => {
    // In a real app, these values would typically be initialized by checking 
    // for a token in localStorage or sessionStorage.
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState(null); // The user's primary key ID
    const [userRole, setUserRole] = useState(null); // Role (e.g., 'user', 'volunteer', 'admin')
    const [token, setToken] = useState(null); // JWT for API authorization

    /**
     * Function called by the Login component on successful authentication.
     * @param {number} id - The user's ID (user_id).
     * @param {string} role - The user's role.
     * @param {string} jwt - The authentication token.
     */
    const login = useCallback((id, role, jwt) => {
        setUserId(id);
        setUserRole(role);
        setToken(jwt);
        setIsAuthenticated(true);
        // NOTE: In production, store the JWT in secure storage here.
        console.log(`User ${id} logged in with role: ${role}`);
    }, []);

    const logout = useCallback(() => {
        setUserId(null);
        setUserRole(null);
        setToken(null);
        setIsAuthenticated(false);
        // NOTE: In production, clear the JWT from storage here.
        console.log("User logged out.");
    }, []);

    const contextValue = {
        // State values
        isAuthenticated,
        userId,
        userRole,
        token,

        // Handlers
        login,
        logout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
