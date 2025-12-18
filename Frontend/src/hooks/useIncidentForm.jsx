import { useState, useCallback } from 'react';
import { useAuthApi } from './useAuthApi.jsx'; // Central API hook

/**
 * Custom hook to manage state, validation, and submission for the IncidentReport form.
 */
export const useIncidentForm = (initialForm = {}) => {
    const [formData, setFormData] = useState({
        category: null,
        location: '',
        landmark: '',
        description: '',
        email: '',
        phone: '',
        animalDetails: '',
        urgency: 'Medium',
        preferredActions: [],
        photoFile: null,
        // Default values for fields matching the backend Incident model
        report_date: new Date().toISOString().slice(0, 10),
        // Note: assigned_to and status are handled by the backend
        ...initialForm,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Custom hook for API interaction (handles token)
    const { post } = useAuthApi();

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleActionChange = useCallback((value, checked) => {
        setFormData(prev => ({
            ...prev,
            preferredActions: checked
                ? [...prev.preferredActions, value]
                : prev.preferredActions.filter(a => a !== value),
        }));
    }, []);

    const handleFileChange = useCallback((file) => {
        setFormData(prev => ({ ...prev, photoFile: file }));
    }, []);

    const validateForm = useCallback(() => {
        if (!formData.category) return "Please select an incident category.";
        if (!formData.location || !formData.description) return "Location and description are required.";
        if (!formData.phone && !formData.email) return "A contact method (phone or email) is required.";
        return null; // Validation passes
    }, [formData]);


    const submitReport = useCallback(async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        // --- Prepare Payload for Backend ---
        // NOTE: File upload requires FormData, but for simple JSON routes:
        const payload = {
            category: formData.category,
            location: formData.location,
            landmark: formData.landmark,
            description: formData.description,
            email: formData.email,
            phone: formData.phone,
            animal_details: formData.animalDetails,
            photo: formData.photoFile ? `Uploaded: ${formData.photoFile.name}` : null, // Placeholder for URL/filename
            urgency: formData.urgency,
            preferred_actions: formData.preferredActions.join(', '), // Convert array to comma-separated string
            report_date: formData.report_date,
            status: 'Pending',
            // assigned_to and posted_by will be populated by middleware/backend logic
        };

        try {
            // POST to the protected endpoint /api/incidents
            // The backend controller will save this using dbRaw.execute (raw SQL INSERT)
            await post('/api/incidents', payload);

            setIsSubmitted(true);

        } catch (err) {
            setError(err.message || "Failed to submit report. Please try again.");
            setIsSubmitted(false);
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm, post]);

    const resetForm = useCallback(() => {
        setFormData({
            category: null,
            location: '',
            landmark: '',
            description: '',
            email: '',
            phone: '',
            animalDetails: '',
            urgency: 'Medium',
            preferredActions: [],
            photoFile: null,
            report_date: new Date().toISOString().slice(0, 10),
        });
        setIsLoading(false);
        setError(null);
        setIsSubmitted(false);
    }, []);


    return {
        // State
        formData,
        isLoading,
        error,
        isSubmitted,

        // Handlers
        handleInputChange,
        handleActionChange,
        handleFileChange,
        submitReport,
        resetForm,
        setError, // Allow component to clear manual errors
    };
};
