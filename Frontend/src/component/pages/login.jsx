import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
    ArrowRight, User, Lock, Mail, PawPrint, Bone, MapPin, Phone, 
    Calendar, AlertTriangle, Send, Key, X, Users, MessageSquare, Clock, Plus, Minus
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext.jsx'; 

// --- Configuration (Unchanged) ---
const PRIMARY_COLOR = '#3B82F6'; 
const ACCENT_COLOR = '#F472B6'; 
const BG_COLOR = '#F8FAFC'; 
const CARD_BG = '#FFFFFF';
const BORDER_COLOR = '#E5E7EB';
const MIN_PASSWORD_LENGTH = 8;
const BASE_URL = 'http://localhost:5000';

// --- Helper Components (SelectField, InputField, TextAreaField, ForgotPasswordModal, VolunteerDashboard are defined above and omitted for brevity) ---

/**
 * Custom styled Select component for better professionalism.
 */
const SelectField = ({ name, placeholder, icon: Icon, value, onChange, options, required = true }) => (
    <div className="relative">
        <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full border ${BORDER_COLOR} pl-12 pr-10 py-3 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-${CARD_BG} shadow-sm text-gray-700`}
            required={required}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
    </div>
);

// Input Field Component (Enhanced Styling)
const InputField = ({ name, type, placeholder, icon: Icon, value, onChange, required = true, min, max }) => (
    <div className="relative">
        <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className={`w-full border ${BORDER_COLOR} pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-${CARD_BG} shadow-sm`}
            required={required}
        />
    </div>
);

// Textarea Component for detailed input
const TextAreaField = ({ name, placeholder, value, onChange, required = true }) => (
    <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows="3"
        className={`w-full border ${BORDER_COLOR} p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-${CARD_BG} shadow-sm`}
        required={required}
    />
);


// Auth Form Component (Professional Design - Enhanced for Role Selection)
const AuthForm = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    
    // **NEW FIELD ADDITIONS for Volunteer Detail Capture**
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', phone: '', 
        role: 'user', address: '', bio: '', skills: '', preferred_hours: ''
    });

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Role options reflecting the new ENUM in the backend
    const roleOptions = [
        { value: 'user', label: 'Citizen Reporter / Adopter' },
        { value: 'volunteer', label: 'Volunteer (Responder/Handler)' },
        { value: 'admin', label: 'Shelter Staff / Admin' }
    ];

    // Address options for a specific region (India context)
    const addressOptions = [
        { value: 'Chennai', label: 'Chennai' },
        { value: 'Bangalore', label: 'Bangalore' },
        { value: 'Mumbai', label: 'Mumbai' },
        { value: 'Delhi', label: 'Delhi' },
        { value: 'Hyderabad', label: 'Hyderabad' },
    ];

    // --- Client-Side Validation ---
    const validateForm = () => {
        if (!formData.email || !formData.password) {
            return "Email and Password are required.";
        }
        if (formData.password.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }
        if (isSignup) {
            if (formData.password !== formData.confirmPassword) {
                return "Passwords do not match.";
            }
            if (!formData.name || !formData.phone || !formData.address || !formData.role) {
                return "All mandatory fields are required.";
            }
            // Add validation for critical volunteer fields
            if (formData.role === 'volunteer' && (!formData.skills || !formData.preferred_hours)) {
                return "Volunteer role requires Skills and Preferred Hours.";
            }
        }
        return null; // Validation passes
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setMessage('');

        const validationError = validateForm();
        if (validationError) {
            return setMessage(validationError);
        }

        setIsLoading(true);

        const endpoint = isSignup ? '/api/users/register' : '/api/users/login';

        const payload = {
            email: formData.email,
            password: formData.password,
        };

        if (isSignup) {
            payload.name = formData.name;
            payload.phone = formData.phone; 
            payload.address = formData.address; 
            payload.role = formData.role; 
            
            // NOTE: Merging detailed info into the 'bio'/'description' field if needed.
            // Since your backend schema only has 'bio' (implicitly via description column 
            // in original thought), we'll add extra details to the `name` or `bio` for now 
            // to ensure they are visible on the dashboard without schema change.
            if (payload.role === 'volunteer') {
                payload.name = `${formData.name} (VOLUNTEER)`; // Highlight in dashboard list
                payload.bio = `Skills: ${formData.skills}. Hours: ${formData.preferred_hours}. ${formData.bio}`;
            } else if (payload.role === 'admin') {
                payload.name = `${formData.name} (STAFF)`; // Highlight in dashboard list
            }
            
            // Note: The backend only stores name, email, password, phone, address, role.
            // The extra fields (skills, hours) are merged into the name/bio for visibility.
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isSignup ? 'register' : 'log in'}.`);
            }

            // --- SUCCESS ---
            const userRole = data.role || 'user';
            login(data.id, userRole, data.token); 
            
            // Redirect based on role
            if (userRole === 'admin' || userRole === 'volunteer') {
                navigate("/reports"); // Sends Staff/Volunteers to the management view
            } else {
                navigate("/home"); // Sends regular users to the public view
            }
            
        } catch (error) {
            console.error("Auth Error:", error);
            setMessage(error.message || "An unexpected error occurred. Please check network.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleForm = () => {
        setFormData(prev => ({ 
            ...prev, 
            name: '', email: '', password: '', confirmPassword: '', phone: '', 
            role: 'user', address: '', bio: '', skills: '', preferred_hours: ''
        }));
        setMessage('');
        setIsSignup(!isSignup);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-${BG_COLOR} to-blue-50 p-4`}>
            <div className={`bg-${CARD_BG} rounded-2xl shadow-2xl w-full max-w-md p-8 relative transition-all duration-300 transform hover:shadow-3xl`}>
                
                {/* Header */}
                <div className="text-center mb-8">
                    <PawPrint size={48} className={`text-blue-500 mb-3 mx-auto`} />
                    <h2 className="text-3xl font-extrabold text-gray-900">{isSignup ? "Create Account" : "Welcome Back"}</h2>
                    <p className="text-md text-gray-500 mt-2">{isSignup ? "Sign up to help or report incidents." : "Access your Animal Welfare Dashboard."}</p>
                </div>

                {/* Error Message */}
                {message && (
                    <div className="flex items-center p-3 mb-6 rounded-xl bg-red-50 text-red-700 font-medium text-sm border border-red-200 shadow-sm">
                        <AlertTriangle size={18} className="mr-3 flex-shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    
                    {/* Common Fields */}
                    <InputField name="email" type="email" placeholder="Email Address" icon={Mail} value={formData.email} onChange={handleChange} />
                    <InputField name="password" type="password" placeholder={`Password (min ${MIN_PASSWORD_LENGTH} chars)`} icon={Lock} value={formData.password} onChange={handleChange} />
                    
                    {/* Signup Fields */}
                    {isSignup && (
                        <div className="space-y-5 pt-2">
                            <InputField name="confirmPassword" type="password" placeholder="Confirm Password" icon={Lock} value={formData.confirmPassword} onChange={handleChange} />
                            <InputField name="name" type="text" placeholder="Full Name" icon={User} value={formData.name} onChange={handleChange} />
                            <InputField name="phone" type="tel" placeholder="Phone Number" icon={Phone} value={formData.phone} onChange={handleChange} />

                            {/* City and Role Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField 
                                    name="address"
                                    placeholder="Select City/Region"
                                    icon={MapPin}
                                    value={formData.address}
                                    onChange={handleChange}
                                    options={addressOptions}
                                />
                                <SelectField
                                    name="role"
                                    placeholder="Select Role"
                                    icon={Users}
                                    value={formData.role}
                                    onChange={handleChange}
                                    options={roleOptions}
                                />
                            </div>

                            {/* Conditional Volunteer Fields */}
                            {formData.role === 'volunteer' && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                                    <h4 className="flex items-center text-sm font-semibold text-blue-700">
                                        <Clock size={16} className="mr-2"/> Volunteer Details
                                    </h4>
                                    <InputField 
                                        name="skills" 
                                        type="text" 
                                        placeholder="Skills (e.g., first aid, transport, photography)" 
                                        icon={Plus} 
                                        value={formData.skills} 
                                        onChange={handleChange} 
                                        required={true}
                                    />
                                    <InputField 
                                        name="preferred_hours" 
                                        type="text" 
                                        placeholder="Preferred Availability/Hours (e.g., Weekends, Evenings)" 
                                        icon={Calendar} 
                                        value={formData.preferred_hours} 
                                        onChange={handleChange} 
                                        required={true}
                                    />
                                </div>
                            )}

                            <TextAreaField 
                                name="bio" 
                                placeholder="Personal Statement / Bio (Optional)"
                                value={formData.bio}
                                onChange={handleChange}
                                required={false}
                            />

                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition transform hover:scale-[1.005] bg-gradient-to-r from-blue-500 to-blue-600 flex justify-center items-center disabled:opacity-50`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full mr-3"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                {isSignup ? "Create Account" : "Sign In"} <ArrowRight size={18} className="ml-2" />
                            </>
                        )}
                    </button>
                    
                    {/* Forgot Password */}
                    <button 
                        type="button" 
                        onClick={() => setIsForgotModalOpen(true)}
                        className="w-full text-sm text-gray-500 hover:text-blue-600 transition pt-2 text-center"
                    >
                        Forgot Password?
                    </button>
                </form>

                {/* Toggle Sign Up/In */}
                <p className="text-center text-sm mt-6 text-gray-700">
                    {isSignup ? "Already have an account?" : "New to PawBridge?"}{" "}
                    <button onClick={toggleForm} className={`text-blue-600 font-semibold hover:underline`}>
                        {isSignup ? "Log In" : "Create Account"}
                    </button>
                </p>
            </div>

            {/* Forgot Password Modal Component (details omitted for brevity) */}
            {/* The rest of the file (ForgotPasswordModal, VolunteerDashboard, Login exports) remains the same */}
        </div>
    );
};

// ... (Rest of the file remains the same)

const Login = () => {
    return <AuthForm />;
};

export const VolunteerDashboard = () => (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gray-50`}>
        <PawPrint size={80} className={`text-gray-500 animate-bounce-slow mb-6`} />
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">Volunteer Hub</h1>
        <p className="text-gray-600 text-center max-w-md">Dedicated portal for managing assigned incidents and volunteer activities.</p>
    </div>
);

// Helper Components (full definitions needed if exporting entire file)
const ForgotPasswordModal = () => null; // Placeholder for omitted code

export default Login;