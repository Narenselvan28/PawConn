import React, { useState, useCallback, useMemo } from 'react';
import { 
    CalendarDays, RefreshCw, Plus, X, MapPin, Clock, Users, User, Edit, Trash2, Tag, ChevronDown, Heart
} from 'lucide-react';
import { useAuthApi } from '../../hooks/useAuthApi.jsx'; 
import { useAuth } from '../../context/AuthContext.jsx'; 

// --- Theme & Configuration Constants ---
const PRIMARY_COLOR = '#A27B5C'; // Mocha Brown
const ACTIVE_COLOR = '#40513B'; // Dark Sage Green
const SECONDARY_COLOR = '#667EEA'; // Purple
const URGENT_COLOR = '#EF4444'; // Red
const SUCCESS_COLOR = '#10B981'; // Green

// --- Data Configs ---
const EVENT_CATEGORIES = ['workshop', 'vaccination', 'fundraiser', 'cleanup', 'other'];
const EVENT_STATUSES = ['upcoming', 'active', 'completed', 'cancelled'];

// --- Helper Components ---

const StatusPill = React.memo(({ status }) => {
    const lowerStatus = status?.toLowerCase();
    const displayStatus = lowerStatus?.charAt(0).toUpperCase() + lowerStatus?.slice(1);
    
    const config = {
        upcoming: { color: SECONDARY_COLOR, bg: 'bg-indigo-100' },
        active: { color: ACTIVE_COLOR, bg: 'bg-[#E3EBE6]' },
        completed: { color: SUCCESS_COLOR, bg: 'bg-green-100' },
        cancelled: { color: URGENT_COLOR, bg: 'bg-red-100' },
    };

    const style = config[lowerStatus] || config.upcoming;

    return (
        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${style.bg}`} style={{ color: style.color }}>
            {displayStatus}
        </span>
    );
});

const ActionButton = React.memo(({ onClick, icon: Icon, color = 'primary', title }) => {
    // color can be 'primary' (default) or 'red' for delete/urgent actions
    const background = color === 'red' ? URGENT_COLOR : PRIMARY_COLOR;
    return (
        <button
            onClick={onClick}
            title={title}
            className="inline-flex items-center justify-center px-2 py-1 rounded-md text-white text-xs"
            style={{ backgroundColor: background }}
        >
            <Icon size={14} />
        </button>
    );
});


// --- Events List Component ---
function EventsList({ events, users, onUpdate, onDelete, userRole, userId }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('upcoming');
    
    // Filter logic
    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || event.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    // Handle updates (requires PUT to /api/events/:id)
    const handleStatusChange = async (eventId, newStatus) => {
        await onUpdate(`/api/events/${eventId}`, { status: newStatus }, 'PUT');
    };
    
    // Handle deletion (requires DELETE to /api/events/:id)
    const handleDelete = (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            onUpdate(`/api/events/${eventId}`, null, 'DELETE');
        }
    };
    
    // Check if the user is authorized to perform CRUD actions on events
    const isStaff = userRole === 'admin' || userRole === 'volunteer';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input 
                    type="text" 
                    placeholder="Search event title or location..." 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg"
                >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="all">All Statuses</option>
                </select>
            </div>

            <div className="shadow-xl ring-1 ring-black ring-opacity-5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['ID', 'Title', 'Date', 'Location', 'Category', 'Status', 'Poster', 'Actions'].map(header => (
                                    <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvents.map(event => {
                                const poster = users.find(u => u.user_id === event.posted_by);
                                const isPoster = poster?.user_id === userId;
                                
                                return (
                                    <tr key={event.event_id} className="hover:bg-blue-50 transition duration-150">
                                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">#{event.event_id}</td>
                                        <td className="px-4 py-4 text-sm font-medium">{event.title}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{new Date(event.event_date).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{event.location}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{event.category}</td>
                                        <td className="px-4 py-4 whitespace-nowrap"><StatusPill status={event.status} /></td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{poster?.name || 'Admin'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex space-x-1">
                                                {isStaff && (
                                                    <>
                                                        <select
                                                            value={event.status}
                                                            onChange={(e) => handleStatusChange(event.event_id, e.target.value)}
                                                            className="text-xs border border-gray-300 rounded-md px-2 py-1"
                                                            style={{ maxWidth: '100px' }}
                                                        >
                                                            {EVENT_STATUSES.map(status => (<option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>))}
                                                        </select>
                                                        {(isPoster || userRole === 'admin') && (
                                                            <ActionButton onClick={() => handleDelete(event.event_id)} icon={Trash2} color="red"/>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredEvents.length === 0 && (<div className="text-center py-10 text-gray-500"><CalendarDays size={48} className="mx-auto mb-4" /><p>No events found matching criteria.</p></div>)}
            </div>
        </div>
    );
}

// --- Event Creation Modal ---
function EventFormModal({ isOpen, onClose, onSave, isSubmitting }) {
    const [eventData, setEventData] = useState({ title: '', description: '', location: '', event_date: '', category: 'workshop', status: 'upcoming' });
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation check for empty fields
        if (!eventData.title || !eventData.location || !eventData.event_date) {
            alert("Please fill in all required fields (Title, Location, Date).");
            return;
        }
        onSave(eventData);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Add New Event</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="title" required placeholder="Event Title *" onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                    <textarea name="description" required placeholder="Description" onChange={handleChange} rows="3" className="w-full p-2 border rounded-lg text-sm resize-none"/>
                    <input type="text" name="location" required placeholder="Location *" onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                    <input type="datetime-local" name="event_date" required onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                    
                    <select name="category" onChange={handleChange} className="w-full p-2 border rounded-lg text-sm">
                        {EVENT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>))}
                    </select>
                    <select name="status" onChange={handleChange} className="w-full p-2 border rounded-lg text-sm">
                        {EVENT_STATUSES.map(status => (<option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>))}
                    </select>
                    
                    <div className="flex justify-between pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-stone-700 text-white rounded-lg">
                            {isSubmitting ? 'Saving...' : 'Save Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------
// --- Main Events Page Component ---
// --------------------------------------------------------------------
export default function EventsWorkshops() {
    const { get, post, put, del } = useAuthApi();
    // Assuming useAuth provides { userRole: 'admin'/'volunteer'/'user', user: { id: 123 } }
    const { userRole, user } = useAuth(); 
    
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Determine the user's ID for checking event ownership
    const userId = user?.id; 
    
    // FIX: Removed useEffect. This function is now the only data loading entry point.
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch events (public endpoint) and users (admin endpoint) concurrently
            const [eventsData, usersData] = await Promise.all([
                get('/api/events'),
                get('/api/admin/users').catch(() => []) // Catch error if user isn't admin for user list
            ]);
            setEvents(eventsData || []);
            setUsers(usersData || []);
        } catch (err) {
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [get]);

    // Handler for all CRUD actions (POST, PUT, DELETE)
    const handleUpdate = useCallback(async (endpoint, payload, method = 'PUT') => {
        setIsSubmitting(true);
        setError(null);
        try {
            let response;
            switch (method) {
                case 'POST':
                    // POST /api/events requires volunteer/admin role
                    response = await post(endpoint, payload);
                    break;
                case 'PUT':
                    // PUT /api/events/:id requires volunteer/admin role
                    response = await put(endpoint, payload);
                    break;
                case 'DELETE':
                    // DELETE /api/events/:id requires volunteer/admin role and checks poster_id
                    response = await del(endpoint);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }
            
            // Refresh data immediately after successful operation
            await fetchData();
            return response;
        } catch (err) {
            setError(`Operation Failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [post, put, del, fetchData]);
    
    // --- Render ---
    return (
        <div className="min-h-screen p-4" style={{ backgroundColor: '#FAFAFA' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header and Actions */}
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <CalendarDays size={28} className="mr-3" style={{ color: PRIMARY_COLOR }} />
                        Event & Workshop Schedule
                    </h1>
                    <div className="flex space-x-3">
                        <button onClick={fetchData} disabled={loading} className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: PRIMARY_COLOR }}>
                            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Fetch Events
                        </button>
                        {userRole && (userRole === 'admin' || userRole === 'volunteer') && (
                            <button onClick={() => setIsModalOpen(true)} className={`flex items-center px-4 py-2 rounded-lg text-white font-medium`} style={{ backgroundColor: ACTIVE_COLOR }}>
                                <Plus size={18} className="mr-1" /> Create Event
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                
                {/* Events List */}
                <EventsList 
                    events={events} 
                    users={users} 
                    onUpdate={handleUpdate} 
                    onDelete={handleUpdate} 
                    userRole={userRole} 
                    userId={userId} 
                />
            </div>
            
            {/* Event Creation Modal */}
            <EventFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={async (data) => {
                    setIsSubmitting(true);
                    // Converts local datetime string to ISO format for backend
                    const isoData = { ...data, event_date: new Date(data.event_date).toISOString() }; 
                    await handleUpdate('/api/events', isoData, 'POST');
                    setIsSubmitting(false);
                    setIsModalOpen(false);
                }}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
