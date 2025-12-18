import React, { useState, useCallback, useMemo } from 'react';
import {
    Plus, RefreshCw, AlertTriangle, List, Clock, CheckCircle,
    X, MapPin, AlertOctagon,
    Edit, Trash2
} from 'lucide-react';

// ====================================================================
// CRITICAL FIX: Importing the REAL hook for production readiness
// ====================================================================
import { useAuthApi } from '../../hooks/useAuthApi.jsx'; // Assuming this path is correct

// --- Design & Backend Constants ---
const PRIMARY_COLOR = 'bg-blue-600';
const PRIMARY_HOVER = 'hover:bg-blue-700';
const TEXT_COLOR = 'text-gray-800';
const BORDER_COLOR = 'border-gray-300';
const CARD_BG = 'bg-white';
const PENDING_COLOR = 'text-amber-600';
const RESOLVED_COLOR = 'text-green-600';
const FAILED_COLOR = 'text-red-600';

// --- Helper Components ---

function StatusPill({ status }) {
    const lowerStatus = status?.toLowerCase();
    const displayStatus = lowerStatus ? lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1).replace('_', ' ') : 'Unknown';
    let colorClass = 'text-gray-500 bg-gray-100';
    let Icon = Clock;

    if (lowerStatus === 'pending' || lowerStatus === 'in_progress' || lowerStatus === 'reviewed') {
        colorClass = PENDING_COLOR + ' bg-amber-50';
        Icon = AlertTriangle;
    } else if (lowerStatus === 'resolved') {
        colorClass = RESOLVED_COLOR + ' bg-green-50';
        Icon = CheckCircle;
    } else if (lowerStatus === 'dismissed') {
        colorClass = 'text-red-500 bg-red-50';
        Icon = X;
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            <Icon size={12} className="mr-1.5" />{displayStatus}
        </span>
    );
}

function ReportsTable({ reports }) {
    const priorityMap = {
        'urgent': 'Urgent', 'high': 'High', 'medium': 'Medium', 'low': 'Low'
    };

    return (
        <div className="shadow-xl ring-1 ring-black ring-opacity-5 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title / Location</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Reported</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${BORDER_COLOR} ${CARD_BG}`}>
                    {reports.map(r => (
                        <tr key={r.report_id} className="hover:bg-blue-50 transition duration-150">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">#{r.report_id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                <p className="truncate max-w-xs">{r.title}</p>
                                <p className="text-gray-500 text-xs flex items-center mt-1">
                                    <MapPin size={12} className="mr-1" /> {r.location || 'N/A'}
                                </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{r.category}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm"><StatusPill status={r.status} /></td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-700">{priorityMap[r.priority.toLowerCase()] || r.priority}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {new Date(r.date_reported).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {/* This button suggests admin/staff users can edit the report */}
                                <button title="Edit Details" className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-100 transition">
                                    <Edit size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {reports.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p className="flex justify-center items-center"><List size={24} className="mr-2" /> No reports found. Refresh data.</p>
                </div>
            )}
        </div>
    );
}

// --- Report Submission Modal Component ---
function ReportFormModal({ isOpen, onClose, onSubmit, isSubmitting, submissionStatus }) {
    if (!isOpen) return null;

    const categoryOptions = [
        { value: 'injury', label: 'Injury/Wound' },
        { value: 'abuse', label: 'Abuse' },
        { value: 'neglect', label: 'Neglect/Poor Condition' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'abandonment', label: 'Abandonment' },
        { value: 'other', label: 'Other Issue' },
    ];

    const priorityOptions = [
        { value: 'medium', label: 'Medium (General Check)' },
        { value: 'high', label: 'High (Needs Attention Soon)' },
        { value: 'urgent', label: 'Urgent (Immediate Danger/Pain)' },
        { value: 'low', label: 'Low (Informational)' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl transition-transform duration-300 transform scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <AlertOctagon size={24} className="mr-2 text-blue-600" /> Submit New Report
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></span>
                            <input type="text" name="title" required placeholder="Dog injury, road obstruction, etc." className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></span>
                            <input type="text" name="location" required placeholder="Street address or nearest landmark" className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-gray-700">Detailed Description <span className="text-red-500">*</span></span>
                        <textarea name="description" required rows="3" placeholder="Describe the situation in detail: animal condition, specific needs, etc." className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3 resize-none`}></textarea>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></span>
                            <select name="category" required className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`}>
                                <option value="" disabled>Select Report Type</option>
                                {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Priority</span>
                            <select name="priority" className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`}>
                                {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <p className={`text-sm font-medium ${submissionStatus.includes('Error') ? FAILED_COLOR : 'text-gray-600'}`}>
                            {submissionStatus}
                        </p>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`inline-flex items-center justify-center py-3 px-6 shadow-lg text-sm font-bold rounded-xl text-white ${PRIMARY_COLOR} ${PRIMARY_HOVER} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 disabled:opacity-50`}
                        >
                            {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            {isSubmitting ? 'Submitting...' : 'Confirm & Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ====================================================================
// --- Main Component ---
// ====================================================================
export default function ReportsPortalMinimal() {
    // Using the authenticated API hook
    const { get, post } = useAuthApi();
    const [reports, setReports] = useState([]);
    const [status, setStatus] = useState("Click 'Refresh' to load data.");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('');

    // Core function to fetch data (Manual trigger)
    const fetchReports = useCallback(async () => {
        setStatus("Fetching reports...");
        try {
            // GET request is correctly configured to fetch all reports for logged-in users.
            const data = await get('/api/reports');
            setReports(data || []);
            setStatus(`Successfully loaded ${data ? data.length : 0} reports.`);
        } catch (err) {
            const errorMessage = err.message.includes('401') ?
                "Authentication failed. Please log in again." :
                `Failed to load reports. ${err.message || ''}`;
            setStatus(`Error: ${errorMessage}`);
            setReports([]);
        }
    }, [get]);

    // Handle form submission inside the modal
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus("Submitting report...");

        const formData = new FormData(e.target);

        const reportData = {
            title: formData.get('title'),
            description: formData.get('description'),
            location: formData.get('location'),
            category: formData.get('category'),
            priority: formData.get('priority') || 'medium',
            // 'visibility' field defaults to 'public' on the backend, as requested
        };

        try {
            // POST request to create a new report
            await post('/api/reports', reportData);
            setSubmissionStatus("Report submitted successfully! Updating list.");
            e.target.reset();

            // Auto-refresh the list after success
            setTimeout(() => {
                setShowFormModal(false);
                setSubmissionStatus('');
                fetchReports(); // Reload data to show the new entry
            }, 1000);

        } catch (err) {
            setSubmissionStatus("Submission Error: " + (err.message || "Failed to submit. Check server console."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header and Actions */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8 border-b border-gray-200 pb-4">
                    <h1 className={`text-4xl font-extrabold text-gray-900`}>Reports Portal</h1>
                    <div className="mt-3 sm:mt-0 flex space-x-3">
                        <button
                            onClick={fetchReports}
                            className={`inline-flex items-center px-5 py-2.5 border ${BORDER_COLOR} shadow-md text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <RefreshCw size={16} className="mr-2" /> Refresh List
                        </button>
                        <button
                            onClick={() => { setShowFormModal(true); setSubmissionStatus(''); }}
                            className={`inline-flex items-center px-5 py-2.5 shadow-lg text-sm font-bold rounded-xl text-white ${PRIMARY_COLOR} ${PRIMARY_HOVER} transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        >
                            <Plus size={16} className="mr-2" /> Submit New Report
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                <p className="text-sm text-gray-600 mb-4 font-medium">{status}</p>

                {/* Reports List */}
                <h2 className={`text-2xl font-bold mb-4 ${TEXT_COLOR} flex items-center`}>
                    <List size={20} className="mr-2 text-blue-600" /> Recent Submissions ({reports.length})
                </h2>

                <ReportsTable reports={reports} />
            </div>

            {/* Report Submission Modal */}
            <ReportFormModal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submissionStatus={submissionStatus}
            />
        </div>
    );
}