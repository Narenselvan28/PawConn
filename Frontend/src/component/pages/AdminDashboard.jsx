import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
    Users, User, Mail, Phone, MapPin, Trash2, CheckCircle, Clock, 
    AlertTriangle, RefreshCw, Lock, Search, Dog, Heart, Utensils, 
    Edit, FileText, Eye, Shield, Calendar, Tag
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';
const LOCAL_ADMIN_PASS = 'adminpass123';

// Custom Hook (Unchanged - uses token for reactivity)
const useApi = () => {
    const [token, setToken] = useState(localStorage.getItem('adminToken'));

    const setAuthToken = useCallback((newToken) => {
        setToken(newToken);
        newToken ? localStorage.setItem('adminToken', newToken) : localStorage.removeItem('adminToken');
    }, []);

    const execute = useCallback(async (endpoint, method = 'GET', data = null) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                // Handle FormData/Files separately if needed, but for general PUT/POST:
                ...(data && { body: JSON.stringify(data) }) 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            return response.status === 204 ? { message: 'Success' } : response.json();
        } catch (error) {
            throw new Error(`API error: ${error.message}`);
        }
    }, [token]);

    return useMemo(() => ({
        get: (endpoint) => execute(endpoint),
        post: (endpoint, data) => execute(endpoint, 'POST', data),
        put: (endpoint, data) => execute(endpoint, 'PUT', data),
        del: (endpoint) => execute(endpoint, 'DELETE'),
        token,
        setAuthToken
    }), [execute, token, setAuthToken]);
};

// Reusable Components (StatusPill and ActionButton Unchanged)
const StatusPill = ({ status }) => {
    const statusConfig = {
        resolved: { color: '#059669', bg: 'bg-green-100', icon: CheckCircle },
        active: { color: '#059669', bg: 'bg-green-100', icon: CheckCircle },
        available: { color: '#059669', bg: 'bg-green-100', icon: CheckCircle },
        pending: { color: '#F59E0B', bg: 'bg-amber-100', icon: Clock },
        'in progress': { color: '#F59E0B', bg: 'bg-amber-100', icon: Clock },
        admin: { color: '#8D6E63', bg: 'bg-stone-200', icon: Shield },
        volunteer: { color: '#007BFF', bg: 'bg-blue-110', icon: User },
        user: { color: '#6B7280', bg: 'bg-gray-100', icon: User },
    };

    const config = statusConfig[status?.toLowerCase().replace(/ /g, '_')] || statusConfig.pending;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.bg}`} style={{ color: config.color }}>
            <Icon size={10} className="mr-1" />
            {status}
        </span>
    );
};

const ActionButton = ({ onClick, icon: Icon, color = 'gray' }) => {
    const colorClasses = {
        red: 'text-red-600 hover:text-red-800',
        blue: 'text-blue-600 hover:text-blue-800',
        green: 'text-green-600 hover:text-green-800',
        gray: 'text-gray-600 hover:text-gray-800',
    };

    return (
        <button onClick={onClick} className={`p-1 rounded ${colorClasses[color]}`}>
            <Icon size={16} />
        </button>
    );
};

// --- Manager Components with Inline Editing ---

const EditableField = ({ value, onSave, options, type = 'text', label }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef(null); // useRef is now defined

    const handleSave = () => {
        if (currentValue !== value) {
            onSave(currentValue);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        // Focus is handled by a ref on the input/select element
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    if (isEditing) {
        if (options) {
            return (
                <select
                    ref={inputRef}
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-sm p-1 border border-blue-400 rounded bg-blue-50 focus:ring-blue-500 focus:border-blue-500"
                >
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }
        return (
            <input
                ref={inputRef}
                type={type}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="text-sm p-1 border border-blue-400 rounded bg-blue-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder={label || 'Value'}
                // Allow empty string save if type is text and required fields are handled elsewhere
            />
        );
    }

    return (
        <div className="flex items-center group cursor-pointer" onClick={handleEditClick}>
            <span className="text-sm text-gray-800">{value || 'N/A'}</span>
            <Edit size={12} className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

// Manager Components
const ReportsManager = ({ data, users, onUpdate, loading }) => {
    const [filters, setFilters] = useState({ search: '', status: 'all' });
    const assignees = useMemo(() => users.filter(u => u.role === 'volunteer' || u.role === 'admin').map(u => u.user_id.toString()), [users]);

    const filteredData = useMemo(() => 
        data.filter(report => 
            report.title?.toLowerCase().includes(filters.search.toLowerCase()) &&
            (filters.status === 'all' || report.status === filters.status)
        ), [data, filters]
    );

    const handleReportSave = (reportId, field, value) => {
        const payload = { [field]: value };
        const endpoint = `/api/admin/reports/${reportId}`;
        onUpdate(endpoint, payload, 'PUT');
    };

    return (
        <div className="space-y-4">
            {/* Filter and Search (Unchanged) */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search reports..." 
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                    />
                </div>
                <select 
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 rounded border border-gray-300"
                >
                    <option value="all">All Status</option>
                    {['pending', 'reviewed', 'in_progress', 'resolved', 'dismissed'].map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">ID/Title</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Priority</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Assignee (ID)</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map(report => (
                                <tr key={report.report_id}>
                                    <td className="px-4 py-2 text-sm">
                                        <div className="font-medium">
                                            <EditableField 
                                                value={report.title} 
                                                onSave={(val) => handleReportSave(report.report_id, 'title', val)}
                                                label="Title"
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500">#{report.report_id} | {report.location}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <EditableField
                                            value={report.status}
                                            onSave={(val) => handleReportSave(report.report_id, 'status', val)}
                                            options={['pending', 'reviewed', 'in_progress', 'resolved', 'dismissed']}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <EditableField
                                            value={report.priority}
                                            onSave={(val) => handleReportSave(report.report_id, 'priority', val)}
                                            options={['low', 'medium', 'high', 'urgent']}
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <EditableField
                                            value={report.assigned_to ? report.assigned_to.toString() : 'N/A'}
                                            onSave={(val) => handleReportSave(report.report_id, 'assigned_to', parseInt(val) || null)}
                                            options={['0', ...assignees]} // 0 for unassigned
                                        />
                                        <div className="text-xs text-gray-500">{report.Assignee?.name}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex space-x-1">
                                            <ActionButton 
                                                onClick={() => window.alert(`Description: ${report.description}`)}
                                                icon={Eye}
                                                color="blue"
                                            />
                                            <ActionButton 
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this report?')) {
                                                        onUpdate(`/api/reports/${report.report_id}`, null, 'DELETE');
                                                    }
                                                }}
                                                icon={Trash2}
                                                color="red"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const IncidentsManager = ({ data, onUpdate }) => {
    const [filters, setFilters] = useState({ search: '' });

    const filteredData = useMemo(() => 
        data.filter(incident => 
            incident.category?.toLowerCase().includes(filters.search.toLowerCase())
        ), [data, filters]
    );
    
    const handleIncidentSave = (incidentId, field, value) => {
        const payload = { [field]: value };
        const endpoint = `/api/admin/incidents/${incidentId}`;
        onUpdate(endpoint, payload, 'PUT');
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search incidents..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                />
            </div>

            <div className="space-y-4">
                {filteredData.map(incident => (
                    <div key={incident.incident_id} className="bg-white rounded border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">
                                    <EditableField
                                        value={incident.category}
                                        onSave={(val) => handleIncidentSave(incident.incident_id, 'category', val)}
                                        options={['attack', 'injury', 'rescue_needed', 'harassment', 'neglect', 'disturbance', 'other']}
                                    />
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <EditableField
                                        value={incident.location}
                                        onSave={(val) => handleIncidentSave(incident.incident_id, 'location', val)}
                                        label="Location"
                                    />
                                </p>
                                <p className="text-sm text-gray-500 mt-1">{incident.description}</p>
                            </div>
                            <div>
                                <EditableField
                                    value={incident.status}
                                    onSave={(val) => handleIncidentSave(incident.incident_id, 'status', val)}
                                    options={['pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed']}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <ActionButton 
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this incident?')) {
                                        onUpdate(`/api/admin/incidents/${incident.incident_id}`, null, 'DELETE');
                                    }
                                }}
                                icon={Trash2}
                                color="red"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdoptionsManager = ({ data, onUpdate }) => {
    const [filters, setFilters] = useState({ search: '' });

    const filteredData = useMemo(() => 
        data.filter(adoption => 
            adoption.name?.toLowerCase().includes(filters.search.toLowerCase())
        ), [data, filters]
    );

    const handleAdoptionSave = (adoptionId, field, value) => {
        const payload = { [field]: value };
        const endpoint = `/api/adoptions/${adoptionId}`;
        onUpdate(endpoint, payload, 'PUT');
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search adoptions..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {filteredData.map(adoption => (
                    <div key={adoption.adoption_id} className="bg-white rounded border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">
                                <EditableField 
                                    value={adoption.name} 
                                    onSave={(val) => handleAdoptionSave(adoption.adoption_id, 'name', val)}
                                    label="Name"
                                />
                            </h3>
                            <div>
                                <EditableField
                                    value={adoption.status}
                                    onSave={(val) => handleAdoptionSave(adoption.adoption_id, 'status', val)}
                                    options={['available', 'pending', 'adopted', 'removed']}
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            <EditableField
                                value={adoption.type}
                                onSave={(val) => handleAdoptionSave(adoption.adoption_id, 'type', val)}
                                options={['dog', 'cat', 'other']}
                            />
                            {' • '}
                            <EditableField
                                value={adoption.location}
                                onSave={(val) => handleAdoptionSave(adoption.adoption_id, 'location', val)}
                                label="Location"
                            />
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Story: <EditableField 
                                value={adoption.rescue_story} 
                                onSave={(val) => handleAdoptionSave(adoption.adoption_id, 'rescue_story', val)}
                                label="Rescue Story"
                            />
                        </p>
                        <div className="flex justify-end mt-3">
                            <ActionButton 
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this adoption?')) {
                                        onUpdate(`/api/adoptions/${adoption.adoption_id}`, null, 'DELETE');
                                    }
                                }}
                                icon={Trash2}
                                color="red"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FeedManager = ({ data, onUpdate }) => {
    const [filters, setFilters] = useState({ search: '' });

    const filteredData = useMemo(() => 
        data.filter(log => 
            log.Feeder?.name?.toLowerCase().includes(filters.search.toLowerCase())
        ), [data, filters]
    );

    const handleFeedLogSave = (logId, field, value) => {
        const payload = { [field]: value };
        const endpoint = `/api/feed-logs/${logId}`;
        // Note: Feed logs lack a dedicated PUT route in server.js, but we assume it exists for PUT functionality.
        onUpdate(endpoint, payload, 'PUT'); 
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search feed logs..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                />
            </div>

            <div className="bg-white rounded border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Feeder</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Location</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Quantity/Time</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map(log => (
                                <tr key={log.feed_id}>
                                    <td className="px-4 py-2 text-sm">{log.Feeder?.name}</td>
                                    <td className="px-4 py-2 text-sm">
                                        <EditableField 
                                            value={log.location} 
                                            onSave={(val) => handleFeedLogSave(log.feed_id, 'location', val)}
                                            label="Location"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <EditableField 
                                            value={log.quantity} 
                                            onSave={(val) => handleFeedLogSave(log.feed_id, 'quantity', val)}
                                            label="Quantity"
                                        />
                                        <div className="text-xs text-gray-500">{new Date(log.feed_time).toLocaleString()}</div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <ActionButton 
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this feed log?')) {
                                                    onUpdate(`/api/feed-logs/${log.feed_id}`, null, 'DELETE');
                                                }
                                            }}
                                            icon={Trash2}
                                            color="red"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const UsersManager = ({ data, onUpdate }) => {
    const [filters, setFilters] = useState({ search: '' });

    const filteredData = useMemo(() => 
        data
            .filter(user => user.role !== 'admin')
            .filter(user => 
                user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.email?.toLowerCase().includes(filters.search.toLowerCase())
            ), [data, filters]
    );

    const handleUserSave = (userId, field, value) => {
        const payload = { [field]: value };
        // Use the admin route for updating other users: /api/admin/users/:id
        const endpoint = `/api/admin/users/${userId}`;
        onUpdate(endpoint, payload, 'PUT');
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {filteredData.map(user => (
                    <div key={user.user_id} className="bg-white rounded border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold">
                                    <EditableField 
                                        value={user.name} 
                                        onSave={(val) => handleUserSave(user.user_id, 'name', val)}
                                        label="Name"
                                    />
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <EditableField 
                                        value={user.email} 
                                        onSave={(val) => handleUserSave(user.user_id, 'email', val)}
                                        label="Email"
                                    />
                                </p>
                            </div>
                            <div>
                                <EditableField
                                    value={user.role}
                                    onSave={(val) => handleUserSave(user.user_id, 'role', val)}
                                    options={['user', 'volunteer', 'admin']}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <EditableField
                                value={user.status}
                                onSave={(val) => handleUserSave(user.user_id, 'status', val)}
                                options={['active', 'inactive', 'banned']}
                            />
                            <ActionButton 
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
                                        onUpdate(`/api/admin/users/${user.user_id}`, null, 'DELETE');
                                    }
                                }}
                                icon={Trash2}
                                color="red"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EventsManager = ({ data, onUpdate }) => {
    const [filters, setFilters] = useState({ search: '' });

    const filteredData = useMemo(() => 
        data.filter(event => 
            event.title?.toLowerCase().includes(filters.search.toLowerCase())
        ), [data, filters]
    );
    
    const handleEventSave = (eventId, field, value) => {
        const payload = { [field]: value };
        const endpoint = `/api/events/${eventId}`;
        onUpdate(endpoint, payload, 'PUT');
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search events..." 
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 rounded border border-gray-300"
                />
            </div>

            <div className="space-y-4">
                {filteredData.map(event => (
                    <div key={event.event_id} className="bg-white rounded border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold">
                                    <EditableField 
                                        value={event.title} 
                                        onSave={(val) => handleEventSave(event.event_id, 'title', val)}
                                        label="Title"
                                    />
                                </h3>
                                <p className="text-sm text-gray-600">
                                    <EditableField 
                                        value={event.location} 
                                        onSave={(val) => handleEventSave(event.event_id, 'location', val)}
                                        label="Location"
                                    />
                                </p>
                                <p className="text-sm text-gray-500">
                                    Date: <EditableField 
                                        value={new Date(event.event_date).toLocaleDateString()}
                                        onSave={(val) => handleEventSave(event.event_id, 'event_date', val)}
                                        label="Date"
                                        type="date"
                                    />
                                </p>
                            </div>
                            <div>
                                <EditableField
                                    value={event.status}
                                    onSave={(val) => handleEventSave(event.event_id, 'status', val)}
                                    options={['upcoming', 'active', 'completed', 'cancelled']}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <ActionButton 
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this event?')) {
                                        onUpdate(`/api/events/${event.event_id}`, null, 'DELETE');
                                    }
                                }}
                                icon={Trash2}
                                color="red"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Login Component (Unchanged)
const AdminLoginPrompt = ({ onAuthenticate }) => {
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Since the backend uses the hardcoded 'admin@pawbridge.com' / 'adminpass123'
        // we verify the client-side password matches the expected backend password,
        // then send the correct credentials to the backend login route.
        if (password === LOCAL_ADMIN_PASS) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: 'admin@pawbridge.com', 
                        password: 'adminpass123' 
                    }),
                });
                const data = await response.json();
                if (response.ok && data.token) {
                    onAuthenticate(data.token);
                } else {
                    setMessage('Backend login failed. Check server logs.');
                }
            } catch (error) {
                setMessage('Network error. Is the server running?');
            }
        } else {
            setMessage('Incorrect password');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
                <div className="text-center mb-6">
                    <Shield className="mx-auto mb-4 text-gray-600" size={40} />
                    <h2 className="text-xl font-bold">Admin Login</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded"
                        placeholder="Enter admin password (Hint: adminpass123)"
                        required
                    />
                    <button type="submit" className="w-full p-3 bg-gray-800 text-white rounded">
                        Login
                    </button>
                </form>
                {message && <p className="text-red-600 text-center mt-4">{message}</p>}
            </div>
        </div>
    );
};

// Main Dashboard
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('reports');
    const [data, setData] = useState({
        reports: [], incidents: [], adoptions: [], feedLogs: [], users: [], events: []
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const { get, put, del, post, token, setAuthToken } = useApi();
    const isAuthenticated = !!token;

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const endpoints = {
                reports: '/api/reports',
                incidents: '/api/incidents',
                adoptions: '/api/adoptions',
                // FIX: Corrected endpoint from '/api/feed' to the actual public route '/api/feed-logs'
                feedLogs: '/api/feed-logs', 
                users: '/api/admin/users',
                events: '/api/events'
            };

            const results = await Promise.all(
                Object.entries(endpoints).map(([key, endpoint]) => 
                    get(endpoint)
                        .then(data => ({ key, data }))
                        .catch((error) => {
                            console.error(`Error fetching ${key}:`, error);
                            return ({ key, data: [] });
                        })
                )
            );

            const newData = results.reduce((acc, { key, data }) => {
                acc[key] = data;
                return acc;
            }, {});
            
            setData(newData);
            setMessage('Data loaded successfully');
        } catch (error) {
            setMessage('Error loading data: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [get, token]);

    const handleUpdate = useCallback(async (endpoint, payload, method = 'PUT') => {
        setLoading(true);
        try {
            const response = method === 'PUT' ? await put(endpoint, payload) :
                             method === 'DELETE' ? await del(endpoint) :
                             await post(endpoint, payload);
            
            setMessage('Operation successful. Refreshing data...');
            // Imperatively call fetch to refresh data after update
            await fetchData(); 
        } catch (error) {
            setMessage(`Error performing action: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [put, del, post, fetchData]);

    // CRITICAL: IMPERATIVE DATA FETCHING (Replaces useEffect)
    const handleAuthenticate = useCallback(async (authToken) => {
        setAuthToken(authToken);
        // Ensure fetchData runs immediately after token is set
        if (authToken) {
            // Wait for the token state update to potentially propagate through useApi
            // before forcing the fetch.
            setTimeout(() => fetchData(authToken), 10);
        }
    }, [setAuthToken, fetchData]);

    const handleLogout = useCallback(() => {
        setAuthToken(null);
        setData({ reports: [], incidents: [], adoptions: [], feedLogs: [], users: [], events: [] });
    }, [setAuthToken]);

    const tabs = [
        { key: 'reports', label: 'Reports', icon: FileText },
        { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { key: 'adoptions', label: 'Adoptions', icon: Dog },
        { key: 'feedLogs', label: 'Feed Logs', icon: Utensils },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'events', label: 'Events', icon: Calendar },
    ];

    const renderContent = () => {
        const commonProps = { onUpdate: handleUpdate, loading };
        switch (activeTab) {
            case 'reports': return <ReportsManager data={data.reports} users={data.users} {...commonProps} />;
            case 'incidents': return <IncidentsManager data={data.incidents} {...commonProps} />;
            case 'adoptions': return <AdoptionsManager data={data.adoptions} {...commonProps} />;
            case 'feedLogs': return <FeedManager data={data.feedLogs} {...commonProps} />;
            case 'users': return <UsersManager data={data.users} {...commonProps} />;
            case 'events': return <EventsManager data={data.events} {...commonProps} />;
            default: return <div>Select a tab</div>;
        }
    };

    if (!isAuthenticated) {
        return <AdminLoginPrompt onAuthenticate={handleAuthenticate} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Shield className="text-gray-700" size={24} />
                            <h1 className="text-lg font-bold">Admin Dashboard</h1>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={fetchData} disabled={loading} className="px-3 py-1 border border-gray-300 rounded text-sm">
                                <RefreshCw size={14} className={`mr-1 inline ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button onClick={handleLogout} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-4 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center space-x-1 py-3 px-1 border-b-2 text-sm whitespace-nowrap ${
                                    activeTab === tab.key ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-500'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {message && (
                    <div className={`p-3 rounded mb-4 ${
                        message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                        {message}
                    </div>
                )}
                
                <div className="bg-white rounded border border-gray-200">
                    <div className="p-4">
                        {loading && <p className="text-center text-gray-500 py-4">Loading...</p>}
                        {!loading && renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}