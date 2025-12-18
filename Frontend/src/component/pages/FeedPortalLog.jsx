import React, { useState, useCallback } from 'react';
import { 
    Plus, X, RefreshCw, AlertTriangle, Utensils, MapPin, Calendar, CheckCircle, Clock, Users, User, List
} from 'lucide-react';
// Assuming useAuthApi.jsx provides standard { get, post, put } methods
import { useAuthApi } from '../../hooks/useAuthApi.jsx'; 

// --- Theme & Configuration Constants (Unchanged) ---
const PRIMARY_COLOR = '#40513B'; // Dark Sage Green (Feed Action/Header)
const PRIMARY_HOVER = 'hover:bg-[#506349]';
const ACCENT_BG = 'bg-gray-50';
const CARD_BG = 'bg-white';
const TEXT_COLOR = 'text-gray-800';
const BORDER_COLOR = 'border-gray-300';
const SUCCESS_COLOR = 'text-green-600';
const FAILED_COLOR = 'text-red-600';
const PENDING_COLOR = 'text-amber-600';

// --- Simulation: Assuming the authenticated volunteer/user is linked to this area ---
const MockUserLocation = 'Chennai'; 

// --- Data Configs ---
const foodTypeOptions = [
    { value: 'Dry Kibble', label: 'Dry Kibble' },
    { value: 'Wet Food', label: 'Wet Food' },
    { value: 'Cooked Meal', label: 'Cooked Meal' },
    { value: 'Water Only', label: 'Water Only' },
];

// --------------------------------------------------------------------
// --- Helper Components (Minor changes in FeedLogTable/TaskStatusPill) ---
// --------------------------------------------------------------------

function TaskStatusPill({ status }) {
    const lowerStatus = status?.toLowerCase();
    const displayStatus = lowerStatus ? lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1).replace('_', ' ') : 'Resolved'; 
    
    // NOTE: This pill is for the FeedLogTable, and FeedLogs don't have a status in the model. 
    // They are an action/resolution, so 'resolved' is hardcoded in the parent component.
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${SUCCESS_COLOR} bg-green-50`}>
            <CheckCircle size={12} className="mr-1.5" /> Logged
        </span>
    );
}

function FeedLogTable({ logs }) {
    return (
        <div className="shadow-xl ring-1 ring-black ring-opacity-5 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Log ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location / Landmark</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Food Info</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Logged By</th> {/* Renamed 'Resolved By' to 'Logged By' */}
                    </tr>
                </thead>
                <tbody className={`divide-y ${BORDER_COLOR} ${CARD_BG}`}>
                    {logs.map(log => (
                        <tr key={log.feed_id} className="hover:bg-blue-50 transition duration-150">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">#{log.feed_id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                <span className='font-semibold'>{log.location}</span>
                                <p className='text-xs text-gray-500 mt-1'>{log.landmark || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                <span className='font-semibold'>{log.food_type || 'N/A'}</span>
                                <p className="text-gray-500 text-xs mt-1">Qty: {log.quantity || 'N/A'}</p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                <TaskStatusPill status={'resolved'} />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                <span className='flex items-center text-blue-600 font-medium'>
                                    <User size={14} className='mr-1'/>{log.Feeder?.name || 'Volunteer'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {logs.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    <p className="flex justify-center items-center"><Utensils size={24} className="mr-2" /> No feeding activities recorded yet. Click Refresh to load initial data.</p>
                </div>
            )}
        </div>
    );
}

// --- Feed Complaint Selector (FILTERS BY LOCATION) ---
// Now accepts reports and loading state as props from the parent (FeedLogPortal)
function FeedComplaintSelector({ reports, selectedReportId, onSelect, loading }) {
    if (loading) {
        return <p className='text-center text-gray-500 p-4'><RefreshCw size={16} className='inline animate-spin mr-2'/>Loading reports...</p>
    }

    // Filter reports relevant to feeding issues that are still pending AND match the mock user location
    const relevantReports = reports.filter(r => 
        (r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'in_progress') && // Also allow 'in_progress' to be resolved
        (r.location?.toLowerCase().includes(MockUserLocation.toLowerCase())) && // LOCATION FILTER
        (r.category?.toLowerCase() === 'feed issue' || r.category?.toLowerCase() === 'neglect' || r.category?.toLowerCase() === 'other') // Broad categories for feeding
    );

    return (
        <div className='p-4 border border-blue-300 rounded-lg bg-blue-50 space-y-3'>
            <h4 className='font-semibold text-blue-800 flex items-center'>
                <List size={16} className='mr-2'/> Pending Complaints in {MockUserLocation} 
            </h4>
            <div className='max-h-40 overflow-y-auto border border-blue-200 rounded-md bg-white'>
                
                {relevantReports.length === 0 ? (
                    <p className='p-3 text-sm text-gray-500'>No pending feeding or neglect complaints found in your area.</p>
                ) : (
                    <table className='min-w-full text-sm'>
                        <thead className='bg-gray-100 sticky top-0'>
                            <tr><th className='px-3 py-2 text-left'>ID</th><th className='px-3 py-2 text-left'>Title / Category</th><th className='px-3 py-2 text-right'>Select</th></tr>
                        </thead>
                        <tbody>
                            {relevantReports.map(report => (
                                <tr key={report.report_id} className='border-t hover:bg-yellow-50'>
                                    <td className='px-3 py-2'>#{report.report_id}</td>
                                    <td className='px-3 py-2 text-gray-700'>{report.title} <span className="text-xs text-gray-500">({report.category})</span></td>
                                    <td className='px-3 py-2 text-right'>
                                        <input 
                                            type='radio' 
                                            name='reportLink' 
                                            value={report.report_id} 
                                            checked={selectedReportId === report.report_id}
                                            onChange={() => onSelect(report.report_id)}
                                            className='text-blue-600 focus:ring-blue-500'
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {selectedReportId && <p className='text-sm text-green-700 font-semibold'>Linked to Report #{selectedReportId}. It will be marked RESOLVED upon submission.</p>}
            
            <button type="button" onClick={() => onSelect(null)} className="text-xs text-gray-500 hover:text-gray-700 pt-1">
                Clear Selection
            </button>
        </div>
    );
}


// --- Feed Submission Modal Component ---
// Now accepts reports and reportsLoading as props
function FeedResolutionModal({ isOpen, onClose, onSubmit, isSubmitting, submissionStatus, reports, reportsLoading }) {
    
    // State to manage the selected report ID inside the modal
    const [selectedReportId, setSelectedReportId] = useState(null);

    // Clears the selected ID when the modal closes
    const handleClose = () => {
        setSelectedReportId(null);
        onClose();
    }

    const handleResolutionSubmit = (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const logData = {
            location: formData.get('location'),
            landmark: formData.get('landmark'),
            food_type: formData.get('food_type'),
            quantity: formData.get('quantity'),
            feed_time: formData.get('feed_time') || undefined,
            linked_report_id: selectedReportId, // Pass the selected report ID
        };

        // Pass data up to the main component's handleSubmit
        onSubmit(logData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl transition-transform duration-300 transform scale-100">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CheckCircle size={24} className="mr-2 text-green-600"/> Log Feed Completion
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleResolutionSubmit} className="p-6 space-y-5">
                    
                    {/* 1. Complaint Selector Table */}
                    <FeedComplaintSelector 
                        reports={reports} 
                        selectedReportId={selectedReportId}
                        onSelect={setSelectedReportId}
                        loading={reportsLoading}
                    />

                    {/* 2. Feeding Details Form */}
                    <h3 className="text-lg font-semibold text-gray-700 pt-4 border-t border-gray-200">Feeding Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Location <span className="text-red-500">*</span></span>
                            <input type="text" name="location" required placeholder="Street / Zone Name" defaultValue={MockUserLocation} className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700">Food Type <span className="text-red-500">*</span></span>
                            <select name="food_type" required className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`}>
                                <option value="" disabled>Select Food Given</option>
                                {foodTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Quantity Given</span>
                            <input type="text" name="quantity" placeholder="e.g., 2kg, 1 large bowl" className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700">Landmark (Optional)</span>
                            <input type="text" name="landmark" placeholder="Near monument, specific tree, etc." className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                        </label>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <Calendar size={16} className='mr-2'/> Time of Feeding (Defaults to now)
                        <input type="datetime-local" name="feed_time" className={`mt-1 block w-full border ${BORDER_COLOR} rounded-lg shadow-sm p-3`} />
                    </label>

                    <div className="flex items-center justify-between pt-4">
                        <p className={`text-sm font-medium ${submissionStatus.includes('Error') ? FAILED_COLOR : 'text-gray-600'}`}>
                            {submissionStatus}
                        </p>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className={`inline-flex items-center justify-center py-3 px-6 shadow-lg text-sm font-bold rounded-xl text-white ${PRIMARY_HOVER}`}
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2"/> : <CheckCircle size={16} className="mr-2"/>}
                            {isSubmitting ? 'Resolving...' : 'Resolve Task & Log Feed'}
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
export default function FeedLogPortal() {
    const { get, post, put } = useAuthApi(); 
    const [feedLogs, setFeedLogs] = useState([]);
    const [status, setStatus] = useState("Click 'Refresh Tasks' to load data.");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState('');

    // State required for modal's internal filtering
    const [allReports, setAllReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);


    // Core function to fetch data (Manual trigger)
    const fetchFeedLogs = useCallback(async () => {
        setStatus("Fetching feed tasks...");
        try {
            // ✅ FIX 1: Corrected route from '/api/feed' to '/api/feed-logs'
            const data = await get('/api/feed-logs'); 
            
            const processedLogs = (data || []).map((log) => ({
                ...log,
                status: 'resolved', // Set a default status for display since feed_log model doesn't have one
                feed_id: log.feed_id
            }));

            setFeedLogs(processedLogs || []);
            setStatus(`Successfully loaded ${processedLogs.length} feeding logs.`);
        } catch (err) {
            const errorMessage = err.message.includes('401') ? 
                "Authentication failed. Please log in as a staff/volunteer." : 
                `Failed to load logs. ${err.message || ''}`;
            setStatus(`Error: ${errorMessage}`);
            setFeedLogs([]);
        }
    }, [get]);

    // Function to fetch reports *separately* for the modal selector
    const fetchAllReports = useCallback(async () => {
        setReportsLoading(true);
        try {
            const data = await get('/api/reports');
            setAllReports(data || []);
        } catch (error) {
            console.error("Failed to fetch reports for selector:", error);
            setAllReports([]);
        } finally {
            setReportsLoading(false);
        }
    }, [get]);


    // Handle form submission (Resolution log submission)
    const handleSubmit = async (logData) => {
        setIsSubmitting(true);
        setSubmissionStatus("Recording log and checking for linked task...");

        try {
            // 1. POST request to create a new feed log (Record the action)
            // ✅ FIX 1: Corrected route from '/api/feed' to '/api/feed-logs'
            await post('/api/feed-logs', logData); 

            // 2. Mark the linked report as resolved (Task completion)
            if (logData.linked_report_id) {
                setSubmissionStatus(`Marking Report #${logData.linked_report_id} as resolved...`);
                // ✅ FIX 2: Corrected route from /api/admin/reports/:id/status to /api/admin/reports/:id
                await put(`/api/admin/reports/${logData.linked_report_id}`, {
                    status: 'resolved',
                    // Optional: assign to current user if not already
                    // assigned_to: // req.user.id can't be accessed here, handled on backend
                });
            }
            
            setSubmissionStatus("Task successfully RESOLVED and log recorded!");
            
            setTimeout(() => {
                // Clear and close modal
                setShowFormModal(false);
                setSubmissionStatus('');
                // Refresh the task list manually
                fetchFeedLogs(); 
            }, 1000); 

        } catch (err) {
            setSubmissionStatus("Submission Error: " + (err.message || "Failed to record log or update report."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openModalAndFetchReports = () => {
        setSubmissionStatus(''); // Clear previous status
        fetchAllReports();       // Fetch reports specifically for the modal selector
        setShowFormModal(true);  // Open modal
    };


    return (
        <div className={`min-h-screen ${ACCENT_BG} p-4 sm:p-6 lg:p-8`}>
            <div className="max-w-7xl mx-auto">
                {/* Header and Actions */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8 border-b border-gray-200 pb-4">
                    <h1 className={`text-4xl font-extrabold text-gray-900 flex items-center`}>
                        <Utensils size={32} className='mr-3' style={{ color: PRIMARY_COLOR }}/> **Feed Task Manager**
                    </h1>
                    <div className="mt-3 sm:mt-0 flex space-x-3">
                        <button 
                            onClick={fetchFeedLogs} 
                            className={`inline-flex items-center px-5 py-2.5 border ${BORDER_COLOR} shadow-md text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-100 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <RefreshCw size={16} className="mr-2" /> Refresh Logs
                        </button>
                        <button 
                            onClick={openModalAndFetchReports} 
                            className={`inline-flex items-center px-5 py-2.5 shadow-lg text-sm font-bold rounded-xl text-white ${PRIMARY_HOVER}`}
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            <Users size={16} className="mr-2"/> Log Feed Completion
                        </button>
                    </div>
                </div>

                {/* Status Message */}
                <p className="text-sm text-gray-600 mb-4 font-medium">{status}</p>

                {/* Logs List */}
                <h2 className={`text-2xl font-bold mb-4 ${TEXT_COLOR} flex items-center`}>
                    <Clock size={20} className="mr-2 text-blue-600" /> Feeding Log History ({feedLogs.length})
                </h2>

                <FeedLogTable logs={feedLogs} />
            </div>

            {/* Log Submission Modal (Resolution) */}
            <FeedResolutionModal 
                isOpen={showFormModal} 
                onClose={() => setShowFormModal(false)} 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting} 
                submissionStatus={submissionStatus}
                // Pass reports and loading state to the modal's internal selector
                reports={allReports}
                reportsLoading={reportsLoading}
            />
        </div>
    );
}