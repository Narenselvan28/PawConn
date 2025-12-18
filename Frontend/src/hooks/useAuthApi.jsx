// ====================================================================
// useAuthApi.jsx - CORRECTED
// ====================================================================
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; 
const BASE_URL = 'http://localhost:5000';

export const useAuthApi = () => {
    // FIX: Import the token state variable from AuthContext
    const { isAuthenticated, userRole, userId, token } = useAuth(); 

    /**
     * Generic fetch wrapper that handles request headers and response parsing.
     * ... (comments omitted) ...
     */
    const authFetch = useCallback(async (endpoint, method = 'GET', body = null, requireAuth = true) => {
        const url = `${BASE_URL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
        };

        if (requireAuth) {
            // FIX: Check for the presence of the live token
            if (!isAuthenticated || !token) {
                // If token is null/undefined after login, this indicates a failure or misconfiguration
                throw new Error("Authentication required for this request. Token missing.");
            }
            headers['Authorization'] = `Bearer ${token}`; 
        }
        
        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }

            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return { message: 'Success (No Content)' };
            }

            return await response.json();

        } catch (error) {
            console.error(`API Fetch Error [${method} ${endpoint}]:`, error.message);
            throw error;
        }
    // FIX: Add 'token' to the dependency array. Now, authFetch updates when the token changes (i.e., after login).
    }, [isAuthenticated, token]); 

    // Export the primary API functions built on authFetch
    return {
        get: (endpoint, requireAuth = true) => authFetch(endpoint, 'GET', null, requireAuth),
        post: (endpoint, body, requireAuth = true) => authFetch(endpoint, 'POST', body, requireAuth),
        put: (endpoint, body, requireAuth = true) => authFetch(endpoint, 'PUT', body, requireAuth),
        del: (endpoint, requireAuth = true) => authFetch(endpoint, 'DELETE', null, requireAuth),

        userId,
        userRole
    };
};