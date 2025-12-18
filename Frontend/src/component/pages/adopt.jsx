import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Users, PawPrint, List, User, Mail, Phone, MapPin, Settings, X, 
    Trash2, CheckCircle, Clock, AlertTriangle, ChevronDown, RefreshCw, Key, Lock, ArrowRight,
    Search, Filter, Edit, MoreVertical
} from 'lucide-react';

// --- Theme & Style Constants ---
const PRIMARY = '#B5846F'; // Mocha Brown
const ACCENT = '#4ECDC4'; // Teal/Cyan
const BG_COLOR = '#F9FAFB';
const CARD_BG = '#FFFFFF';
const URGENT_COLOR = '#EF4444'; 
const SUCCESS_COLOR = '#059669'; 
const PENDING_COLOR = '#F59E0B'; 
const ADMIN_COLOR = '#8D6E63'; 
const LOCAL_ADMIN_PASS = 'adminpass123';

// --- Custom Hook for API Calls (Integrated and Self-Contained) ---
const useApi = () => {
    // Note: This hook is self-contained for the Admin Dashboard
    const [token, setToken] = useState(localStorage.getItem('adminToken') || null);

    const setAuthToken = useCallback((newToken) => {
        if (newToken) {
            localStorage.setItem('adminToken', newToken);
        } else {
            localStorage.removeItem('adminToken');
        }
        setToken(newToken);
    }, []);

    const apiCall = useCallback(async (endpoint, options = {}) => {
        const url = `http://localhost:5000${endpoint}`;
        
        const currentToken = localStorage.getItem('adminToken');
        if (endpoint.includes('/api/admin') && !currentToken) {
            // Throw specific error to be caught by the Dashboard component
            throw new Error("401"); 
        }

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Attach the token only if available
                ...(currentToken && { 'Authorization': `Bearer ${currentToken}` }),
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401 || response.status === 403) {
                // If unauthorized, clear token to force relogin
                setAuthToken(null);
                throw new Error("Unauthorized, session expired.");
            }
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.slice(0, 50)}`);
            }
            
            return response.json();
        } catch (error) {
            throw error;
        }
    }, [setAuthToken]);

    return useMemo(() => ({ 
        get: (endpoint) => apiCall(endpoint),
        put: (endpoint, data) => apiCall(endpoint, { method: 'PUT', body: data }),
        del: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
        setAuthToken,
        token
    }), [apiCall, setAuthToken, token]);
};

// --- Helper Components ---
const StatusPill = React.memo(({ status }) => {
    let color, bg, Icon;
    switch (status?.toLowerCase()) {
        case 'resolved':
        case 'active':
        case 'available':
        case 'adopted':
            [color, bg, Icon] = [SUCCESS_COLOR, 'bg-green-100', CheckCircle]; break;
        case 'pending':
        case 'in progress':
            [color, bg, Icon] = [PENDING_COLOR, 'bg-amber-100', Clock]; break;
        case 'admin':
            [color, bg, Icon] = [ADMIN_COLOR, 'bg-stone-200', Settings]; break;
        case 'volunteer':
            [color, bg, Icon] = ['#007BFF', 'bg-blue-100', User]; break;
        default:
            [color, bg, Icon] = [URGENT_COLOR, 'bg-red-100', AlertTriangle];
    }
    return (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${bg}`} style={{ color: color }}>
            <Icon size={12} className="mr-1" />{status}
        </span>
    );
});

const PriorityBadge = ({ priority }) => {
    let color, bg;
    switch (priority?.toLowerCase()) {
        case 'high':
            [color, bg] = [URGENT_COLOR, 'bg-red-100']; break;
        case 'medium':
            [color, bg] = [PENDING_COLOR, 'bg-amber-100']; break;
        case 'low':
            [color, bg] = [SUCCESS_COLOR, 'bg-green-100']; break;
        default:
            [color, bg] = [PENDING_COLOR, 'bg-amber-100'];
    }
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded ${bg}`} style={{ color: color }}>
            {priority}
        </span>
    );
};

// --- Local Password Prompt Component ---
const AdminLoginPrompt = ({ onAuthenticate, message }) => {
    const [password, setPassword] = useState('');
    const [localMessage, setLocalMessage] = useState(message);
    const [isLoading, setIsLoading] = useState(false);
    
    // Define Demo Credentials locally for this prompt (from backend file)
    const DEMO_ADMIN_EMAIL = 'admin@pawbridge.com'; 
    const DEMO_ADMIN_PASS_HARDCODED = 'adminpass123'; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalMessage('');
        setIsLoading(true);

        // 1. Local password check (quick check to avoid hitting API unnecessarily)
        if (password === LOCAL_ADMIN_PASS) {
            
            // 2. Simulate API call to backend's login endpoint to get a valid JWT
            try {
                const response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASS_HARDCODED }), 
                });
                const data = await response.json();
                
                if (response.ok && data.token) {
                    onAuthenticate(data.token); // Pass token up to unlock dashboard
                } else {
                     setLocalMessage('Backend Authentication Failed. Check server logs.');
                }
            } catch (error) {
                setLocalMessage('Network Error. Cannot reach backend API.');
            }
        } else {
            setLocalMessage('Incorrect password. Access denied.');
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 text-center" style={{ borderTop: `5px solid ${URGENT_COLOR}` }}>
                <Key size={48} className="text-stone-700 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h3>
                <p className="text-gray-600 mb-4">Enter master password to access management controls.</p>

                {localMessage && (
                    <div className="p-3 mb-4 rounded-lg bg-red-100 text-red-700 font-medium text-sm">
                        {localMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Master Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-stone-400"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl text-white font-bold transition-all duration-200 disabled:opacity-50"
                        style={{ backgroundColor: ADMIN_COLOR }}
                    >
                        {isLoading ? 'Verifying...' : 'Unlock Dashboard'} <ArrowRight size={18} className='inline ml-2'/>
                    </button>
                </form>
                <p className="text-xs text-gray-400 mt-4">Demo Credentials: admin@pawbridge.com / adminpass123</p>
            </div>
        </div>
    );
};

// --- Tab Content Components ---

const ReportsManager = ({ reports, users, onUpdateReport, onFetch, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredReports = reports.filter(report => {
        const matchesSearch = 
            report.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            report.report_id?.toString().includes(searchTerm) ||
            report.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || report.status?.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt || b.dateReported) - new Date(a.createdAt || a.dateReported));

    const handleStatusChange = async (reportId, newStatus) => {
        await onUpdateReport(`/api/admin/reports/${reportId}/status`, { status: newStatus }, 'PUT');
    };

    const handleAssignmentChange = async (reportId, assignedTo) => {
        await onUpdateReport(`/api/admin/reports/${reportId}/status`, { assignedTo: assignedTo || null }, 'PUT');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search reports..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <button 
                    onClick={onFetch} 
                    disabled={loading} 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['ID', 'Title', 'Priority', 'Location', 'Posted By', 'Status', 'Assignee', 'Actions'].map(header => 
                                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {header}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReports.map(report => {
                                const postingUser = users.find(u => u.user_id === report.postedBy);
                                return (
                                    <tr key={report.report_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            #{report.report_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                                            {report.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <PriorityBadge priority={report.priority} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {report.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {postingUser?.name || 'Anonymous'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusPill status={report.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <select 
                                                defaultValue={report.assignedTo || ''}
                                                onChange={(e) => handleAssignmentChange(report.report_id, e.target.value)}
                                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-stone-400"
                                            >
                                                <option value="">Unassign</option>
                                                {users.filter(u => u.role === 'volunteer' || u.role === 'admin').map(user => (
                                                    <option key={user.user_id} value={user.user_id}>{user.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <select 
                                                defaultValue={report.status}
                                                onChange={(e) => handleStatusChange(report.report_id, e.target.value)}
                                                className="text-sm border border-gray-300 rounded-md px-2 py-1 font-medium focus:ring-2 focus:ring-stone-400"
                                            >
                                                {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredReports.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <List size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No reports found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const IncidentsManager = ({ incidents, users, onUpdateIncident, onFetch, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredIncidents = incidents.filter(incident => {
        const matchesSearch = 
            incident.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            incident.incident_id?.toString().includes(searchTerm) ||
            incident.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || incident.status?.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));

    const handleIncidentUpdate = async (incidentId, updates) => {
        await onUpdateIncident(`/api/admin/incidents/${incidentId}/manage`, updates, 'PUT');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search incidents..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <button 
                    onClick={onFetch} 
                    disabled={loading} 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="grid gap-6">
                {filteredIncidents.map(incident => {
                    const assignedUser = users.find(u => u.user_id === incident.assigned_to);
                    
                    return (
                        <div key={incident.incident_id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {incident.category} - {incident.animal_identity || 'Unknown Animal'}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {incident.location}
                                                </span>
                                                <span>{new Date(incident.date_reported).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusPill status={incident.status} />
                                            <PriorityBadge priority={incident.urgency} />
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 mb-3 line-clamp-2">
                                        {incident.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                        {incident.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} />
                                                {incident.email}
                                            </span>
                                        )}
                                        {incident.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} />
                                                {incident.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                                        <select 
                                            value={incident.assigned_to || ''}
                                            onChange={(e) => handleIncidentUpdate(incident.incident_id, { assignedTo: e.target.value || null })}
                                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-stone-400"
                                        >
                                            <option value="">Unassigned</option>
                                            {users.filter(u => u.role === 'volunteer' || u.role === 'admin').map(user => (
                                                <option key={user.user_id} value={user.user_id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select 
                                            value={incident.status}
                                            onChange={(e) => handleIncidentUpdate(incident.incident_id, { status: e.target.value })}
                                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 font-medium focus:ring-2 focus:ring-stone-400"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            placeholder="Add remarks..."
                                            defaultValue={incident.remarks}
                                            onBlur={(e) => handleIncidentUpdate(incident.incident_id, { remarks: e.target.value })}
                                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-stone-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filteredIncidents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No incidents found matching your criteria</p>
                </div>
            )}
        </div>
    );
};

const UsersManager = ({ users, loading, onFetch, onDeleteUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const nonAdminUsers = users
        .filter(user => user.role !== 'admin')
        .filter(user => {
            const matchesSearch = 
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.user_id?.toString().includes(searchTerm);
            
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            
            return matchesSearch && matchesRole;
        })
        .sort((a, b) => new Date(b.joined_on) - new Date(a.joined_on));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                        />
                    </div>
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-stone-400"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="volunteer">Volunteers</option>
                    </select>
                </div>
                <button 
                    onClick={onFetch} 
                    disabled={loading} 
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined On', 'Actions'].map(header => 
                                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                        {header}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {nonAdminUsers.map(user => (
                                <tr key={user.user_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        #{user.user_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.phone || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusPill status={user.role} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusPill status={user.status || 'active'} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.joined_on).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete user ID ${user.user_id}? This action cannot be undone.`)) {
                                                    onDeleteUser(user.user_id);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-800 p-2 transition-colors rounded-lg hover:bg-red-50"
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {nonAdminUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No users found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Admin Dashboard Component ---
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalMessage, setGlobalMessage] = useState('');
    
    // Authentication State
    const [isLocallyAuthenticated, setIsLocallyAuthenticated] = useState(false);
    // Using the local custom hook logic defined above
    const { get, put, del, token, setAuthToken } = useApi(); 

    // Use Memo to prevent unnecessary fetches if the component rerenders but the token is missing
    const isReadyToFetch = useMemo(() => isLocallyAuthenticated && !!token, [isLocallyAuthenticated, token]);


    // --- API Fetch Logic ---
    const fetchAllData = useCallback(async () => {
        // Only fetch if the local gate is passed AND we have a token
        if (!isReadyToFetch) {
            return;
        } 
        
        setLoading(true);
        setGlobalMessage('');
        try {
            // These routes are protected by the token we obtained upon local successful auth
            const [usersData, reportsData, incidentsData] = await Promise.all([
                get('/api/admin/users'), 
                get('/api/reports'), 
                get('/api/incidents')
            ]);
            
            setUsers(usersData);
            setReports(reportsData);
            setIncidents(incidentsData);
        } catch (error) {
            console.error("Admin Fetch Error:", error);
            setGlobalMessage(`Error loading data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [get, isReadyToFetch]);

    // Initial load effect (Triggers when token is received)
    useEffect(() => {
        // If a token exists (from localStorage or local auth success), trigger data fetch
        if (isReadyToFetch) {
            fetchAllData();
        }
    }, [isReadyToFetch, fetchAllData]);


    // --- Authentication Handler Passed to Prompt Modal ---
    const handleLocalAuthenticate = useCallback((receivedToken) => {
        if (receivedToken) {
            setAuthToken(receivedToken); 
            setIsLocallyAuthenticated(true);
        }
    }, [setAuthToken]);
    
    // --- API Update Handler (Centralized function for PUT/DELETE requests) ---
    const handleAdminUpdate = useCallback(async (endpoint, payload, method) => {
        try {
            setLoading(true);
            const response = await (method === 'PUT' 
                ? put(endpoint, payload) 
                : del(endpoint));
            
            setGlobalMessage(`Successfully updated: ${response.message || 'Data sync successful.'}`);
            await fetchAllData();
        } catch (error) {
            setGlobalMessage(`Update failed: ${error.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => setGlobalMessage(''), 5000); 
        }
    }, [put, del, fetchAllData]);

    const handleDeleteUser = (userIdToDelete) => {
        if (window.confirm(`Are you sure you want to delete user ID ${userIdToDelete}? This action cannot be undone.`)) {
            handleAdminUpdate(`/api/admin/users/${userIdToDelete}`, null, 'DELETE');
        }
    };


    // --- Conditional Render: Show Prompt or Dashboard ---
    if (!isLocallyAuthenticated) {
        return (
            <AdminLoginPrompt onAuthenticate={handleLocalAuthenticate} message="" />
        );
    }
    
    // Tab Navigation Items
    const tabs = [
        { key: 'reports', label: 'Internal Reports', icon: List, count: reports.length },
        { key: 'incidents', label: 'Citizen Incidents', icon: AlertTriangle, count: incidents.length },
        { key: 'users', label: 'User Management', icon: Users, count: users.filter(u => u.role !== 'admin').length },
    ];

    // Render Content based on Active Tab
    const renderContent = () => {
        switch (activeTab) {
            case 'reports':
                return <ReportsManager reports={reports} users={users} loading={loading} onFetch={fetchAllData} onUpdateReport={handleAdminUpdate} />;
            case 'incidents':
                return <IncidentsManager incidents={incidents} users={users} loading={loading} onFetch={fetchAllData} onUpdateIncident={handleAdminUpdate} />;
            case 'users':
                return <UsersManager users={users} loading={loading} onFetch={fetchAllData} onDeleteUser={handleDeleteUser} />;
            default:
                return <div className="text-center py-12 text-gray-500">Select a tab to manage data</div>;
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-8" style={{ background: BG_COLOR }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8 p-6 rounded-xl shadow-lg bg-white border-l-4" style={{ borderColor: ADMIN_COLOR }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                                <Settings size={36} className="mr-3" style={{ color: ADMIN_COLOR }}/> Admin Control Panel 👑
                            </h1>
                            <p className="text-lg text-gray-600 mt-2">
                                Welcome, **System Admin**. You are currently operating under elevated permissions.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setAuthToken(null);
                                setIsLocallyAuthenticated(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
                            style={{ backgroundColor: URGENT_COLOR }}
                        >
                            <Lock size={18} />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Global Message/Status Bar */}
                {globalMessage && (
                    <div className={`mb-6 p-3 rounded-lg font-medium text-white shadow-md ${globalMessage.includes('Error') ? 'bg-red-500' : 'bg-green-500'}`}>
                        {globalMessage}
                    </div>
                )}

                {/* Tab Navigation and Content */}
                <div className="flex gap-1 mb-8 border-b border-gray-300">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-3 font-bold text-lg transition-colors border-b-4 ${activeTab === tab.key
                                    ? 'border-red-500 text-gray-900 bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-100'
                                }`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                            <span className="bg-gray-200 rounded-full px-2 py-1 text-xs min-w-[2rem]">
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
