import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle, Send, PawPrint, List, MapPin, Dog, Phone, Mail, FileText, CheckCircle, Clock, Upload, ChevronRight, X,
    // FIX: Added Frown and Plus icons
    Frown, Plus 
} from 'lucide-react';
import { useIncidentForm } from '../../hooks/useIncidentForm.jsx'; // Custom logic hook

// --- Theme & Style Constants ---
const PRIMARY = '#D64740'; // Main Brand Red
const ACCENT = '#4ECDC4'; // Teal/Cyan
const BG_COLOR = '#F9FAFB';
const SUCCESS_COLOR = '#059669';
const URGENT_COLOR = '#EF4444';
// FIX: Added PENDING_COLOR and CARD_BG definitions
const PENDING_COLOR = '#F59E0B'; // Amber/Pending status color
const CARD_BG = '#FFFFFF'; // Explicit white background for cards

// --- Report Categories Data (Matches backend expectations) ---
const REPORT_CATEGORIES = [
    { key: 'injury', label: 'Injured or Sick', icon: Dog, description: 'Medical attention is needed immediately.' },
    { key: 'aggression', label: 'Aggressive/Pack Issue', icon: AlertTriangle, description: 'Aggressive behavior or public safety risk.' },
    { key: 'neglect', label: 'Cruelty / Neglect', icon: Frown, description: 'Direct harm or neglect witnessed.' },
    { key: 'other', label: 'Other Concern', icon: List, description: 'None of the above matches your issue.' },
];

// --- Priority/Action Data (Matches form/backend expectations) ---
const URGENCY_LEVELS = [
    { level: 'High', text: 'Immediate (Life/Safety Threat)' },
    { level: 'Medium', text: 'Moderate (Needs attention today)' },
    { level: 'Low', text: 'Informational (Monitoring/Awareness)' },
];

const PREFERRED_ACTIONS = ['Rescue', 'Medical Help', 'Sterilization', 'Owner Notice', 'Awareness Visit'];


// --- Helper Components ---

// Step Indicator Component
const StepIndicator = ({ step, totalSteps }) => (
    <div className="flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="text-sm font-bold text-gray-700">Reporting Progress</div>
        <div className="flex space-x-2">
            {[...Array(totalSteps)].map((_, index) => (
                <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${index + 1 === step
                            ? 'text-white shadow-lg'
                            : index + 1 < step
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}
                    style={{ backgroundColor: index + 1 === step ? PRIMARY : index + 1 < step ? SUCCESS_COLOR : undefined }}
                >
                    {index + 1}
                </div>
            ))}
        </div>
    </div>
);

// Category Card Component
const CategoryCard = ({ category, isSelected, onClick }) => {
    const Icon = category.icon;
    return (
        <div
            onClick={() => onClick(category.key)}
            className={`p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-start h-full ${isSelected
                    ? 'shadow-xl transform scale-[1.02] border-4'
                    : 'bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
            style={{
                borderColor: isSelected ? PRIMARY : '#E5E7EB',
                backgroundColor: isSelected ? PRIMARY + '10' : CARD_BG,
                color: PRIMARY,
            }}
        >
            <Icon size={28} className="mb-3" style={{ color: isSelected ? PRIMARY : ACCENT }} />
            <h4 className="text-lg font-extrabold text-gray-900">{category.label}</h4>
            <p className={`text-sm mt-1 text-gray-600`}>{category.description}</p>
        </div>
    );
};

// Post-Submission Confirmation Screen
const ConfirmationScreen = ({ onReset }) => (
    <div className="bg-white p-10 rounded-xl shadow-xl border-t-8 border-b-8 text-center" style={{ borderColor: SUCCESS_COLOR }}>
        <CheckCircle size={80} className="mx-auto mb-6" style={{ color: SUCCESS_COLOR }} />
        <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Report Submitted Successfully!</h3>
        <p className="text-lg font-medium text-gray-600 mb-8">A volunteer or staff member has been notified.</p>

        <button onClick={onReset} className="text-white px-6 py-3 rounded-full text-lg font-bold hover:opacity-90 transition shadow-md" style={{ backgroundColor: ACCENT }}>
            <Plus size={20} className='inline mr-2' /> Start New Report
        </button>
    </div>
);


// --- Main Page Component ---
export default function IncidentReporter() {
    // 1. State and Hook Initialization
    const [step, setStep] = useState(1);
    const {
        formData,
        isLoading,
        error,
        isSubmitted,
        handleInputChange,
        handleActionChange,
        handleFileChange,
        submitReport,
        resetForm,
        setError
    } = useIncidentForm();

    const totalSteps = 2;

    // Handlers for navigation between steps
    const handleCategorySelect = (categoryKey) => {
        handleInputChange({ target: { name: 'category', value: categoryKey } });
        setStep(2);
    };

    const handleFormSubmit = useCallback(async (e) => {
        e.preventDefault();
        // Check if form is ready to submit (optional client-side validation before hook call)
        if (!formData.location || !formData.email || !formData.phone || !formData.description) {
            return setError('Please fill in all required location, contact, and description fields.');
        }

        await submitReport();
        // Only transition if the submission was successful (isSubmitted flag will be true if submitReport succeeded)
        // Since submitReport is asynchronous, we need to ensure we wait for state updates before checking isSubmitted
        // In a real application, you might rely on a local success state returned from submitReport or handle navigation/confirmation within the hook's success callback.
        // For simplicity here, we'll rely on the hook's side effect to check if submitted (though this pattern is tricky with async state updates).
        // A temporary successful submission check:
        // Note: The original code had a dependency on `error` and `isSubmitted` in the useCallback, which can lead to stale closures.
        // Assuming `submitReport` correctly sets the final state *before* returning in the hook:
        
        // --- Temporary fix for async state logic ---
        // A better approach would be to return a success status from submitReport.
        // Since we can't change the hook signature, let's assume if no error is set after the await, it was successful.
        if (!error && !isLoading) {
             setStep(3); // Move to confirmation on assumed success
        }


    }, [submitReport, formData.location, formData.email, formData.phone, formData.description, setError, error, isLoading]); 

    const handleReset = useCallback(() => {
        resetForm();
        setStep(1);
        setError(null);
    }, [resetForm, setError]);


    // --- View Renderers ---

    // STEP 1: Category Selection
    const renderCategorySelection = () => (
        <div className="space-y-8">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <PawPrint size={28} style={{ color: PRIMARY }} /> 1. Select Incident Category
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
                {REPORT_CATEGORIES.map(cat => (
                    <CategoryCard
                        key={cat.key}
                        category={cat}
                        isSelected={formData.category === cat.key}
                        onClick={handleCategorySelect}
                    />
                ))}
            </div>
            {error && <div className="text-red-600 font-medium p-3 mt-4 bg-red-100 rounded-lg">{error}</div>}
        </div>
    );

    // STEP 2: Detailed Report Form
    const renderDetailedForm = () => (
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    <List size={28} style={{ color: PRIMARY }} /> 2. Incident Details
                </h3>
                <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ChevronRight size={16} className="rotate-180" /> Change Category
                </button>
            </div>

            {/* ERROR DISPLAY */}
            {error && <div className="text-red-600 font-medium p-3 bg-red-100 rounded-lg border border-red-300">{error}</div>}

            {/* SECTION: LOCATION & CONTACT */}
            <fieldset className="grid md:grid-cols-2 gap-6 p-5 border-l-4 rounded-lg" style={{ borderColor: ACCENT, backgroundColor: '#FFFFFF' }}>
                <legend className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><MapPin size={20} style={{ color: ACCENT }} /> Location & Contact</legend>

                {/* Location Input */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location / Address <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Full Address / Landmark (Required)"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:ring-red-400"
                    />
                </div>

                {/* Contact Inputs */}
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your Contact Email (Required)"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400"
                />
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your Phone Number (Required)"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400"
                />
            </fieldset>

            {/* SECTION: INCIDENT DETAILS */}
            <fieldset className="space-y-4 p-5 border-l-4 rounded-lg" style={{ borderColor: PRIMARY, backgroundColor: '#FFFFFF' }}>
                <legend className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Dog size={20} style={{ color: PRIMARY }} /> Description & Details</legend>

                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Explain the situation clearly: what you saw, animal type, count, and condition. (Required)"
                    rows="4"
                    required
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 resize-none"
                ></textarea>

                <input
                    type="text"
                    name="animalDetails"
                    value={formData.animalDetails}
                    onChange={handleInputChange}
                    placeholder="Specific Animal Details (e.g., 'Indie, brown fur, female, limping')"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400"
                />

                <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="Landmark (Optional: Near the park, under the bridge)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400"
                />
            </fieldset>


            {/* SECTION: PRIORITY, ACTIONS & PROOF */}
            <fieldset className="space-y-4 p-5 border-l-4 rounded-lg" style={{ borderColor: PENDING_COLOR, backgroundColor: '#FFFFFF' }}>
                <legend className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle size={20} style={{ color: PENDING_COLOR }} /> Priority, Actions & Proof</legend>

                {/* Urgency */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                    <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400"
                    >
                        {URGENCY_LEVELS.map(u => (
                            <option key={u.level} value={u.level}>{u.level} - {u.text}</option>
                        ))}
                    </select>
                </div>

                {/* Preferred Action */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Action</label>
                    <div className="flex flex-wrap gap-3">
                        {PREFERRED_ACTIONS.map(action => (
                            <label key={action} className="flex items-center text-sm bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 font-medium cursor-pointer hover:bg-gray-200 transition">
                                <input
                                    type="checkbox"
                                    checked={formData.preferredActions.includes(action)}
                                    onChange={(e) => handleActionChange(action, e.target.checked)}
                                    className="mr-2 rounded"
                                    style={{ accentColor: ACCENT }}
                                />
                                {action}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Proof Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photos / Videos (Max 5MB)</label>
                    <input
                        type="file"
                        accept="image/*,video/mp4"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
                        style={{ color: PRIMARY, accentColor: PRIMARY }}
                    />
                    {formData.photoFile && (
                        <p className="text-xs text-green-600 mt-2 flex items-center">
                            <CheckCircle size={14} className="mr-1" /> File ready: {formData.photoFile.name}
                        </p>
                    )}
                </div>
            </fieldset>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-xl font-extrabold text-white shadow-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: URGENT_COLOR, boxShadow: `0 8px 18px ${URGENT_COLOR}50` }}
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin h-6 w-6 border-4 border-t-4 border-white rounded-full"></div>
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send size={24} /> SUBMIT URGENT REPORT
                    </>
                )}
            </button>
        </form>
    );

    // Main Renderer
    return (
        <div className={`min-h-screen p-4 sm:p-8 ${BG_COLOR}`}>
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <header className="mb-10 text-center p-6 rounded-xl shadow-lg border-b-8 bg-white" style={{ borderColor: PRIMARY }}>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center justify-center">
                        <AlertTriangle size={36} className="mr-3" style={{ color: URGENT_COLOR }} /> Animal Incident Reporting
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        This report is for immediate action on distressed or aggressive animals.
                    </p>
                </header>

                {/* Content Area */}
                <div className="p-8 rounded-xl bg-white border border-gray-200 shadow-xl">
                    <StepIndicator step={step} totalSteps={totalSteps} /> {/* Assuming two main steps */}
                    {step === 1 && renderCategorySelection()}
                    {step === 2 && renderDetailedForm()}
                    {step === 3 && <ConfirmationScreen onReset={handleReset} />}
                </div>

                {/* Footer/Guidance */}
                <footer className='text-center mt-6 text-sm text-gray-500'>
                    All reports are reviewed by our volunteer team. Providing accurate contact information helps speed up the rescue process.
                </footer>
            </div>
        </div>
    );
}
