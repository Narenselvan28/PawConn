import React, { useState, useCallback, useMemo } from "react";
import { Plus, X, Search, CheckCircle, PauseCircle, Trash2, Edit, FileText, Dog, Upload, AlertTriangle, Stethoscope, Users, MapPin, Heart, Calendar, RefreshCw } from 'lucide-react';
// Assuming useAuthApi is correctly defined in this path
import { useAuthApi } from '../../hooks/useAuthApi.jsx'; 

// --- Theme & Configuration (Cozy Forest Theme) ---
const PRIMARY_COLOR = '#A27B5C'; // Mocha Brown (Main Action/Header)
const ACCENT_BG = 'bg-stone-50';
const CARD_BG = 'bg-white';
const TEXT_COLOR = 'text-gray-800';
const ACTIVE_COLOR = '#40513B'; // Dark Sage Green
const PAUSED_COLOR = '#F59E0B'; // Amber
const REMOVED_COLOR = '#EF4444'; // Red

// --- Data & Configs (Rescue Focused) ---
const petTypes = ["Dog", "Cat", "Other"];
const genders = ["Male", "Female", "Unknown"];
const postStatuses = ["available", "pending", "adopted", "removed"]; // Aligning to DB ENUM
const medicalStatuses = ["Vaccinated", "Neutered/Spayed", "Injured / Recovering", "Special Care"];

// --- Initial Mock Data (Used as fallback) ---
const initialPetAds = [];

// --- Helper Functions and UI Components (Simplified for brevity) ---

const getPostStatusConfig = (status) => {
    const lowerStatus = status?.toLowerCase();
    const map = {
        'available': { color: ACTIVE_COLOR, bg: 'bg-[#E3EBE6]', text: 'text-gray-800', icon: CheckCircle },
        'adopted': { color: '#10B981', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Heart },
        'pending': { color: PAUSED_COLOR, bg: 'bg-amber-100', text: 'text-amber-800', icon: PauseCircle },
        'removed': { color: REMOVED_COLOR, bg: 'bg-red-100', text: 'text-red-800', icon: Trash2 },
    };
    return map[lowerStatus] || map.available;
};

const PostStatusPill = ({ status }) => {
    const { color, bg, text, icon: Icon } = getPostStatusConfig(status);
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`} style={{ borderColor: color }}>
            <Icon size={12} className="mr-1.5" style={{ color: color }} />{status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

// --- Table Row for Pet Ads (Reads snake_case keys) ---
const PetAdRow = ({ ad, updateStatus, onDelete }) => {
    const medical = ad.medical_status?.toLowerCase() || '';
    const isInjured = medical.includes('injured') || medical.includes('recovering');

    return (
        <tr className={`hover:bg-stone-100 transition-colors duration-150 cursor-pointer`}>
            <td className="px-4 py-4 font-bold text-gray-900">
                {ad.name}
                {ad.urgent && <AlertTriangle size={14} className="inline ml-2 text-red-500" title="Urgent Rescue" />}
            </td>
            <td className="px-4 py-4 text-sm text-gray-600">
                {ad.type} ({ad.age})
            </td>
            <td className="px-4 py-4 text-sm font-medium">
                {isInjured 
                    ? <span className="text-red-500">Under Care</span> 
                    : <span className="text-green-600">Stable</span>}
            </td>
            <td className="px-4 py-4 text-sm text-gray-600 truncate max-w-xs" title={ad.rescue_story}>{ad.rescue_story}</td>
            <td className="px-4 py-4 whitespace-nowrap"><PostStatusPill status={ad.status} /></td>
            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); /* Edit logic here */ }} title="Edit Details" className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"><Edit size={18} /></button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(ad.adoption_id, ad.status); }} 
                        title="Toggle Status"
                        className="text-amber-600 hover:text-amber-800 p-1 rounded-full hover:bg-amber-50"
                    >
                        <PauseCircle size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(ad.adoption_id); }} 
                        title="Delete Post"
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const PetAdTableView = ({ ads, updateStatus, onDelete }) => (
    <div className="overflow-x-auto shadow-xl rounded-xl border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50/50">
                <tr>
                    {['Name', 'Type (Age)', 'Health', 'Rescue Story', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-y-200">
                {ads.map(ad => <PetAdRow key={ad.adoption_id} ad={ad} updateStatus={updateStatus} onDelete={onDelete} />)}
            </tbody>
        </table>
        {ads.length === 0 && (
             <div className="text-center py-12 text-gray-500">
                 <FileText size={64} className="mx-auto text-stone-300 mb-4" />
                 <p>No posts match the current criteria.</p>
             </div>
        )}
    </div>
);


// --- Ad Post Form Component (Modal) ---
const AdPostForm = ({ newAd, handleInputChange, handleMedicalChange, handleFileChange, submitAd, resetForm, onClose, setNewAd }) => (
    <form onSubmit={submitAd} className="p-6 space-y-6 max-h-[calc(90vh-70px)] overflow-y-auto">

        {/* Section 1: Core Pet and Medical Info */}
        <div className="p-4 border border-stone-300 rounded-lg bg-stone-50/50">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><MapPin size={18} className="mr-2 text-stone-700" /> Basic Rescue & Medical Info</h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Name & Location */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Name / Location *</label>
                    <div className="flex space-x-2">
                        <input type="text" name="name" value={newAd.name} onChange={handleInputChange} required placeholder="Name/Nickname" className="w-1/2 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition" />
                         <input type="text" name="location" value={newAd.location} onChange={handleInputChange} required placeholder="Shelter/Rescue Location" className="w-1/2 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition" />
                    </div>
                </div>
                
                {/* Age & Gender */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Approx. Age * / Gender</label>
                    <div className="flex space-x-2">
                        <input type="text" name="age" value={newAd.age} onChange={handleInputChange} required placeholder="e.g., 6 months" className="w-1/2 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition" />
                        <select name="gender" value={newAd.gender} onChange={handleInputChange} className="w-1/2 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition">
                            {genders.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
                        </select>
                    </div>
                </div>
                {/* Type & Breed */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Type / Breed</label>
                    <div className="flex space-x-2">
                        <select name="type" value={newAd.type} onChange={handleInputChange} className="w-1/3 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition">
                            {petTypes.map(type => <option key={type} value={type.toLowerCase()}>{type}</option>)}
                        </select>
                        <input type="text" name="breed" value={newAd.breed} onChange={handleInputChange} placeholder="Breed (Mix)" className="w-2/3 border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition" />
                    </div>
                </div>
                 {/* Urgency checkbox (Simplified, kept for functionality) */}
                <div className="flex items-center">
                    <label className="flex items-center text-red-700 font-medium bg-red-50 p-2 rounded-lg border border-red-300 text-sm w-full">
                        <input type="checkbox" name="isUrgent" checked={newAd.isUrgent} onChange={handleInputChange} className="mr-2" style={{ accentColor: REMOVED_COLOR }} />
                        Urgent Rescue Ad
                    </label>
                </div>
            </div>

            {/* Medical Status Checkboxes */}
            <div className="mt-4 pt-4 border-t border-stone-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center"><Stethoscope size={16} className="mr-2 text-gray-600" />Medical Status (Check all that apply) *</label>
                <div className="flex flex-wrap gap-3">
                    {medicalStatuses.map(status => (
                        <label key={status} className="flex items-center text-sm bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm hover:border-stone-400 transition">
                            <input type="checkbox" value={status} checked={newAd.medical.includes(status)} onChange={handleMedicalChange} className="mr-2" style={{ accentColor: PRIMARY_COLOR }} />
                            {status}
                        </label>
                    ))}
                </div>
            </div>
        </div>

        {/* Section 2: Ad Copy and Media */}
        <div className="p-4 border border-stone-300 rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Heart size={18} className="mr-2 text-stone-700" /> Rescue Story & Media</h3>
            
            {/* Ad Description / Rescue Story */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rescue Story / Ad Description *</label>
                <textarea name="adDescription" value={newAd.adDescription} onChange={handleInputChange} required placeholder="Write the compassionate story and behavior notes for the public. Focus on finding a home." rows="4" className="w-full border border-stone-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition resize-none" />
            </div>

            {/* Photos */}
            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Photos (1+ Required) *</label>
                <input type="file" multiple onChange={handleFileChange} className="hidden" id="pet-photos-upload-simple" />
                <label htmlFor="pet-photos-upload-simple" style={{ backgroundColor: ACTIVE_COLOR }} className={`cursor-pointer inline-flex items-center px-4 py-2 border border-stone-300 rounded-full text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200`}>
                    <Upload size={18} className="inline mr-2" />Upload Photos ({newAd.photos.length || 0})
                </label>
                
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    {newAd.photos.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-stone-100 rounded-md border border-stone-300">
                            <FileText size={14} className="mr-1 text-gray-500" />
                            <span className="truncate max-w-[100px]">{file}</span>
                            <button type="button" onClick={() => setNewAd(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))} className="text-red-500 hover:text-red-700 ml-2">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Section 3: Internal Notes (Minimized) */}
        <div className="p-4 border border-stone-200 rounded-lg bg-stone-100/50">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><Users size={16} className="mr-2 text-stone-600" /> Internal / Follow-Up Notes (Admin Only)</h3>
            <textarea name="internalNotes" value={newAd.internalNotes} onChange={handleInputChange} placeholder="e.g., Needs follow-up training schedule, Vet check next Tuesday. (Never public)" rows="2" className="w-full border border-stone-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition resize-none" />
        </div>

        {/* Submission Button */}
        <div className="pt-4 sticky bottom-0 bg-white border-t border-stone-200">
            <button type="submit" style={{ backgroundColor: PRIMARY_COLOR }} className={`w-full py-3 text-white rounded-full font-bold text-lg shadow-lg shadow-stone-400/50 hover:shadow-xl transition-all duration-200`}>
                <Plus size={20} className="inline mr-2" /> Publish Ad
            </button>
            <button type="button" onClick={onClose} className="w-full mt-2 py-3 text-gray-600 rounded-full font-semibold border border-gray-300 hover:bg-gray-100 transition-all duration-200">
                Cancel
            </button>
        </div>
    </form>
);


// --- Main Ad Post Manager Component ---

export default function AdPostManager() {
    const [petAds, setPetAds] = useState(initialPetAds);
    const [loading, setLoading] = useState(false); // Set to false initially, fetch manually
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("available"); // Default to 'available'

    const api = useAuthApi(); // Using the defined API hook

    // Simplified New Ad State, aligned to DB enum types
    const [newAd, setNewAd] = useState({
        name: '', type: petTypes[0].toLowerCase(), breed: '', age: '', gender: genders[0].toLowerCase(),
        medical: [], adDescription: '', photos: [],
        internalNotes: '', isUrgent: false, location: 'Shelter A' 
    });

    // --- API & Fetch Logic (Manual Trigger Only) ---
    
    const fetchAds = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // GET /api/adoptions (Retrieves all adoption posts)
            const data = await api.get('/api/adoptions'); 
            setPetAds(data || initialPetAds);

        } catch (err) {
            const msg = err.message.includes('401') ? "Authentication required or session expired." : "Failed to load ad inventory.";
            setError(msg);
            setPetAds(initialPetAds);
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Initial data load is now triggered manually by the refresh button.

    const resetForm = useCallback(() => {
        setNewAd({
            name: '', type: petTypes[0].toLowerCase(), breed: '', age: '', gender: genders[0].toLowerCase(),
            medical: [], adDescription: '', photos: [],
            internalNotes: '', isUrgent: false, location: 'Shelter A'
        });
        setError(null); // Clear form error state upon reset
    }, []);

    // --- Input Handlers (Unchanged) ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = (name === 'gender' || name === 'type') ? value.toLowerCase() : (type === 'checkbox' ? checked : value);
        
        setNewAd(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleMedicalChange = (e) => {
        const { value, checked } = e.target;
        setNewAd(prev => ({
            ...prev,
            medical: checked ? [...prev.medical, value] : prev.medical.filter(m => m !== value),
        }));
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files).map(file => file.name);
        setNewAd(prev => ({ ...prev, photos: [...prev.photos, ...newFiles] }));
    };

    // --- CRUD Handlers ---

    const updatePostStatus = useCallback(async (adId, currentStatus) => {
        let newStatus = currentStatus;
        if (currentStatus === 'available') newStatus = 'pending';
        else if (currentStatus === 'pending') newStatus = 'available';
        else if (currentStatus === 'adopted') return; // Cannot toggle adopted/removed posts

        if (!window.confirm(`Are you sure you want to change status of #${adId} to ${newStatus}?`)) return;
        
        setLoading(true);
        try {
            // PUT /api/adoptions/:id
            await api.put(`/api/adoptions/${adId}`, { status: newStatus });
            alert(`Post #${adId} status updated to ${newStatus}.`);
            fetchAds(); // Refresh list to reflect changes
        } catch (err) {
            setError(`Failed to update status for #${adId}. ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [api, fetchAds]);

    const deletePost = useCallback(async (adId) => {
        if (!window.confirm(`Are you sure you want to permanently DELETE post #${adId}? This action cannot be undone.`)) return;
        setLoading(true);
        try {
            // DELETE /api/admin/adoptions/:id 
            await api.del(`/api/admin/adoptions/${adId}`);
            alert(`Post #${adId} successfully deleted.`);
            fetchAds(); // Refresh list to reflect changes
        } catch (err) {
            setError(`Failed to delete post #${adId}. ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [api, fetchAds]);


    const submitAd = useCallback(async (e) => {
        e.preventDefault();
        
        if (!newAd.name || !newAd.age || newAd.medical.length === 0 || !newAd.adDescription) {
             setError("Please complete Pet Name, Age, Medical Status, and the Rescue Story.");
             return;
        }

        setLoading(true);
        setError(null);
        
        try {
             const payload = {
                 name: newAd.name,
                 age: newAd.age,
                 gender: newAd.gender,
                 type: newAd.type,
                 // Maps to backend column medical_status
                 medical_status: newAd.medical.join(', '), 
                 rescue_story: newAd.adDescription,
                 photo_url: newAd.photos.length > 0 ? newAd.photos[0] : 'placeholder.png', 
                 follow_up: newAd.internalNotes,
                 location: newAd.location
            };

            // POST /api/adoptions
            await api.post('/api/adoptions', payload);
            
            alert(`New Ad for ${newAd.name} published successfully!`);
            fetchAds(); // Fetch new list immediately
            resetForm();
            setShowModal(false);

        } catch (err) {
            setError(err.message || "Failed to publish ad.");
        } finally {
            setLoading(false);
        }
    }, [newAd, api, fetchAds, resetForm]);


    // --- Memoized Filtering ---
    const filteredAds = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return petAds.filter(ad => {
            const statusMatch = filterStatus === "All" || ad.status.toLowerCase() === filterStatus;
            const searchMatch = !query ||
                ad.name?.toLowerCase().includes(query) ||
                ad.adoption_id?.toString().includes(query) ||
                ad.type?.toLowerCase().includes(query) ||
                ad.medical_status?.toLowerCase().includes(query); // Added medical status to search
            return statusMatch && searchMatch;
        }).sort((a, b) => {
            if (a.status === 'available' && b.status !== 'available') return -1;
            if (a.status !== 'available' && b.status === 'available') return 1;
            return b.adoption_id - a.adoption_id;
        });
    }, [petAds, filterStatus, searchQuery]);

    // --- FINAL RENDER ---

    return (
        <div className={`min-h-screen ${ACCENT_BG} font-sans antialiased`}>
            {/* Header: Mocha Brown Accent */}
            <div className={`sticky top-0 z-30 ${CARD_BG} border-b border-stone-300 shadow-md`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full`} style={{ backgroundColor: PRIMARY_COLOR }}><Dog size={24} className="text-white" /></div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Adoption Post Manager</h1>
                                <p className="text-sm text-gray-500">Manage public-facing rescue and adoption posts.</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            {/* Manual Refresh Button */}
                            <button onClick={fetchAds} disabled={loading} className={`px-4 py-2 text-white rounded-full font-semibold shadow-md transition-all duration-200 ${loading ? 'opacity-50' : ''}`} style={{ backgroundColor: ACTIVE_COLOR }}>
                                {loading ? <RefreshCw size={20} className="inline mr-1 animate-spin" /> : <RefreshCw size={20} className="inline mr-1" />}
                                {loading ? 'Loading...' : 'Refresh Inventory'}
                            </button>
                            {/* Add New Button */}
                            <button onClick={() => { setShowModal(true); resetForm(); }} style={{ backgroundColor: PRIMARY_COLOR }} className={`px-4 py-2 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-200`}>
                                <Plus size={20} className="inline mr-1" /> New Stray Ad
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-4 font-medium">{error}</div>}

                {/* Filter and Search Bar */}
                <div className={`p-6 rounded-xl shadow-lg border border-stone-200 mb-8 ${CARD_BG}`}>
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">

                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Pet Ads</label>
                            <div className="relative">
                                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Pet Name, ID, or Breed/Health..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-stone-300 p-3 pl-12 rounded-full focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition" />
                            </div>
                        </div>

                        <div className="w-full lg:w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Post Status</label>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border border-stone-300 p-3 rounded-full appearance-none pr-10 focus:ring-2 focus:ring-[#A27B5C] focus:border-[#A27B5C] transition">
                                {postStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                <option value="All">All Statuses</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pet Ads Table */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {loading ? 'Loading Inventory...' : `Ad Inventory (${filteredAds.length})`}
                </h2>
                
                {filteredAds.length === 0 && !loading ? (
                    <div className={`text-center py-12 ${CARD_BG} rounded-xl shadow-lg border border-stone-200`}>
                        <FileText size={64} className="mx-auto text-stone-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
                        <p className="text-gray-600 mb-6">Click 'Refresh Inventory' if the list is empty, or 'New Stray Ad' to publish a new pet.</p>
                    </div>
                ) : (
                    <PetAdTableView ads={filteredAds} updateStatus={updatePostStatus} onDelete={deletePost} />
                )}
            </div>

            {/* NEW AD POSTING MODAL (1 Step - Simplified) */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className={`${CARD_BG} rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden`}>

                        {/* Modal Header */}
                        <div style={{ backgroundColor: PRIMARY_COLOR }} className={`p-4 sticky top-0 z-10 rounded-t-xl flex justify-between items-center`}>
                            <h3 className="text-xl font-bold text-white">
                                <Dog size={24} className="inline mr-2" /> New Rescue Ad Post (1-Step)
                            </h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white hover:text-gray-100"><X size={24} /></button>
                        </div>

                        {/* Modal Body: Single Form */}
                        <AdPostForm 
                            newAd={newAd}
                            handleInputChange={handleInputChange}
                            handleMedicalChange={handleMedicalChange}
                            handleFileChange={handleFileChange}
                            submitAd={submitAd}
                            resetForm={resetForm}
                            onClose={() => { setShowModal(false); resetForm(); }}
                            setNewAd={setNewAd} 
                        />

                    </div>
                </div>
            )}
        </div>
    );
};