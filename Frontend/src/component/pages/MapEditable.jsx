// MapEditable.jsx - CORRECTED
import React, { useState, useRef, useEffect } from 'react'; // 👈 ADDED useEffect
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./MapsEditable.css";
import { useAuth } from '../../context/AuthContext'; 

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different zone types
const createCustomIcon = (color) => {
    return L.divIcon({
        html: `
      <div style="
        background-color: ${color}; 
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      "></div>
    `,
        className: 'custom-marker',
        iconSize: [24, 24],
    });
};

const MapEditable = () => {
    const [zones, setZones] = useState([]);
    const [showZoneForm, setShowZoneForm] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 👈 New state for better loading UX

    // Use Auth Context instead of localStorage
    const { isAuthenticated, userRole, token, userId } = useAuth();
    const canCreateZones = isAuthenticated && (userRole === 'admin' || userRole === 'volunteer');

    const zoneFormRef = useRef({
        zone_name: '',
        zone_type: 'Feeding',
        radius_meters: 500,
        dog_population: 0,
        affected_by_rabies: 0,
        bite_cases: 0,
        vaccinated_dogs: 0,
        sterilized_dogs: 0,
        food_score: 5,
        water_score: 5,
        risk_level: 'Low',
        remarks: ''
    });

    // Modern color palette
    const zoneColors = {
        Danger: '#FF6B6B',
        Feeding: '#51CF66',
        Help: '#339AF0',
        Adoption: '#FF922B'
    };

    const riskColors = {
        Low: '#51CF66',
        Medium: '#FCC419',
        High: '#FF6B6B'
    };

    const zoneIcons = {
        Danger: createCustomIcon('#FF6B6B'),
        Feeding: createCustomIcon('#51CF66'),
        Help: createCustomIcon('#339AF0'),
        Adoption: createCustomIcon('#FF922B')
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // ----------------------------------------------------
    // 🟢 FIX 1: Add Initial Data Loading (Missing from original code)
    // ----------------------------------------------------
    const loadAllZones = async () => {
        setLoading(true);
        try {
            // GET /api/zones is a PUBLIC route in server.js, so no Authorization header is needed
            const response = await fetch('http://localhost:5000/api/zones');

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Failed to fetch zones with status ${response.status}`);
            }

            const data = await response.json();
            setZones(data);
            if (!initialLoadComplete) {
                showMessage(`Loaded ${data.length} zones successfully.`, 'success');
                setInitialLoadComplete(true);
            }
        } catch (error) {
            console.error('Error loading zones:', error);
            showMessage('Failed to load zones: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllZones();
    }, []);
    // ----------------------------------------------------

    const MapClickHandler = () => {
        useMapEvents({
            click: (e) => {
                if (!canCreateZones) {
                    showMessage('Only volunteers and admins can create zones', 'warning');
                    return;
                }
                setSelectedPosition(e.latlng);
                zoneFormRef.current.zone_name = `Zone ${zones.length + 1}`;
                setShowZoneForm(true);
            },
        });
        return null;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!canCreateZones) {
            showMessage('Only volunteers and admins can create zones', 'error');
            return;
        }

        // ----------------------------------------------------
        // 🟢 FIX 2: Critical check to ensure a position is selected
        // ----------------------------------------------------
        if (!selectedPosition) {
            showMessage('Please click on the map to select a zone center before saving.', 'error');
            return;
        }
        
        // 🟢 FIX 3: Critical check to ensure token is present for protected POST route
        if (!token) {
            showMessage('You must be logged in to create a zone.', 'error');
            return;
        }
        // ----------------------------------------------------

        try {
            setLoading(true);
            const formData = zoneFormRef.current;

            const zoneData = {
                ...formData,
                // Now safe to access properties
                latitude: selectedPosition.lat, 
                longitude: selectedPosition.lng,
                // Ensure number conversions handle form data correctly
                radius_meters: parseInt(formData.radius_meters) || 0,
                dog_population: parseInt(formData.dog_population) || 0,
                affected_by_rabies: parseInt(formData.affected_by_rabies) || 0,
                bite_cases: parseInt(formData.bite_cases) || 0,
                vaccinated_dogs: parseInt(formData.vaccinated_dogs) || 0,
                sterilized_dogs: parseInt(formData.sterilized_dogs) || 0,
                food_score: parseFloat(formData.food_score) || 0,
                water_score: parseFloat(formData.water_score) || 0,
            };

            const response = await fetch('http://localhost:5000/api/zones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(zoneData)
            });

            if (response.ok) {
                const newZone = await response.json();
                // newZone.zone is nested in the response from the server controller
                setZones(prev => [...prev, newZone.zone]); 
                setShowZoneForm(false);
                setSelectedPosition(null);
                showMessage('Zone created successfully!', 'success');

                // Reset form
                Object.keys(zoneFormRef.current).forEach(key => {
                    zoneFormRef.current[key] = '';
                });
                zoneFormRef.current.zone_type = 'Feeding';
                zoneFormRef.current.radius_meters = 500;
                zoneFormRef.current.risk_level = 'Low';
            } else {
                const error = await response.json();
                showMessage(error.message || 'Failed to create zone', 'error');
            }
        } catch (error) {
            console.error('Error creating zone:', error);
            showMessage('Error creating zone: ' + error.message, 'error'); // Show detailed error
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        zoneFormRef.current[field] = value;
    };

    const canEditZone = (zone) => {
        return isAuthenticated && (userRole === 'admin' || zone.created_by === userId);
    };

    const handleZoneUpdate = async (zoneId, updates) => {
        if (!isAuthenticated || !token) { // Ensure token is present for PUT
            showMessage('Please log in to update zones', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/zones/${zoneId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedZone = await response.json();
                // The server controller returns the updated zone directly (no nesting)
                setZones(prev => prev.map(zone =>
                    zone.zone_id === zoneId ? updatedZone : zone 
                ));
                showMessage('Zone updated successfully!', 'success');
            } else {
                const error = await response.json();
                showMessage(error.message || 'Failed to update zone', 'error');
            }
        } catch (error) {
            console.error('Error updating zone:', error);
            showMessage('Error updating zone', 'error');
        }
    };

    const handleZoneDelete = async (zoneId) => {
        if (!isAuthenticated || userRole !== 'admin' || !token) { // Ensure admin and token are present for DELETE
            showMessage('Only admins can delete zones', 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this zone?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/zones/${zoneId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setZones(prev => prev.filter(zone => zone.zone_id !== zoneId));
                showMessage('Zone deleted successfully!', 'success');
            } else {
                const error = await response.json();
                showMessage(error.message || 'Failed to delete zone', 'error');
            }
        } catch (error) {
            console.error('Error deleting zone:', error);
            showMessage('Error deleting zone', 'error');
        }
    };

    const getZoneStats = () => {
        return {
            total: zones.length,
            danger: zones.filter(z => z.zone_type === 'Danger').length,
            feeding: zones.filter(z => z.zone_type === 'Feeding').length,
            help: zones.filter(z => z.zone_type === 'Help').length,
            adoption: zones.filter(z => z.zone_type === 'Adoption').length,
        };
    };

    const stats = getZoneStats();

    return (
        <div className="modern-map-container">
            {/* Header */}
            <header className="modern-header">
                <div className="header-content">
                    <div className="header-main">
                        <div className="logo">
                            <div className="logo-icon">🗺️</div>
                            <div>
                                <h1>Zone Intelligence</h1>
                                <p>Smart Management Platform</p>
                            </div>
                        </div>
                        <div className="user-info">
                            {isAuthenticated ? (
                                <div className="user-badge">
                                    <span className={`user-role ${userRole}`}>
                                        {userRole}
                                    </span>
                                    <span className="user-id">ID: {userId}</span>
                                </div>
                            ) : (
                                <div className="auth-prompt">
                                    <span>👤 Guest Mode</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {message.text && (
                        <div className={`modern-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card total">
                    <div className="stat-icon">📍</div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.total}</span>
                        <span className="stat-label">Total Zones</span>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.danger}</span>
                        <span className="stat-label">Danger</span>
                    </div>
                </div>
                <div className="stat-card feeding">
                    <div className="stat-icon">🍽️</div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.feeding}</span>
                        <span className="stat-label">Feeding</span>
                    </div>
                </div>
                <div className="stat-card help">
                    <div className="stat-icon">🆘</div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.help}</span>
                        <span className="stat-label">Help</span>
                    </div>
                </div>
                <div className="stat-card adoption">
                    <div className="stat-icon">🏠</div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.adoption}</span>
                        <span className="stat-label">Adoption</span>
                    </div>
                </div>
            </div>

            <div className="modern-content">
                {/* Side Panel */}
                <aside className="modern-sidebar">
                    <div className="sidebar-section">
                        <h3>Zone Legend</h3>
                        <div className="modern-legend">
                            {Object.entries(zoneColors).map(([type, color]) => (
                                <div key={type} className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: color }}></div>
                                    <span>{type}</span>
                                    <span className="legend-count">{stats[type.toLowerCase()]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>Zone Creation</h3>
                        <div className="creation-info">
                            {canCreateZones ? (
                                <>
                                    <div className="permission-badge authorized">
                                        ✅ Authorized to create zones
                                    </div>
                                    <p className="info-text">
                                        Click anywhere on the map to create a new zone.
                                        You can set radius, population data, and risk levels.
                                    </p>
                                    <button
                                        className="create-zone-btn"
                                        onClick={() => {
                                            if (!canCreateZones) {
                                                showMessage('Only volunteers and admins can create zones', 'warning');
                                                return;
                                            }
                                            // 🟢 Do NOT show the form without a selected position, encourage map click
                                            if (!selectedPosition) {
                                                showMessage('First, click on the map to select the zone center.', 'info');
                                            } else {
                                                setShowZoneForm(true);
                                            }
                                        }}
                                    >
                                        <span className="btn-icon">➕</span>
                                        Create New Zone
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="permission-badge unauthorized">
                                        ⚠️ Zone Creation Restricted
                                    </div>
                                    <p className="info-text">
                                        Only volunteers and administrators can create zones.
                                        {!isAuthenticated ? ' Please sign in first.' : ` Your current role (${userRole}) doesn't have permission.`}
                                    </p>
                                    {!isAuthenticated ? (
                                        <button
                                            className="login-btn"
                                            onClick={() => showMessage('Please use the login page to sign in', 'info')}
                                        >
                                            Sign In to Access
                                        </button>
                                    ) : (
                                        <div className="role-info">
                                            Current role: <strong>{userRole}</strong>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>Quick Guide</h3>
                        <div className="guide-steps">
                            <div className="guide-step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <strong>Click map</strong> to place zone center
                                </div>
                            </div>
                            <div className="guide-step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <strong>Set radius</strong> and zone properties
                                </div>
                            </div>
                            <div className="guide-step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <strong>Monitor</strong> zones with real-time data
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Map Area */}
                <main className="modern-map-area">
                    <div className="map-header-bar">
                        <div className="map-title">
                            <h2>Interactive Zone Map</h2>
                            <p>Visualize and manage all zones in real-time</p>
                        </div>
                        <div className="map-controls">
                            <button className="control-btn" onClick={loadAllZones} disabled={loading}>
                                🔄 {loading && initialLoadComplete ? 'Loading...' : 'Refresh Zones'}
                            </button>
                            {canCreateZones && selectedPosition && (
                                <button
                                    className="control-btn primary"
                                    onClick={() => setShowZoneForm(true)}
                                >
                                    ➕ Create New Zone
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="map-container">
                        <MapContainer
                            center={[40.7128, -74.0060]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />

                            <MapClickHandler />

                            {/* Show the temporary selected position before saving */}
                            {selectedPosition && !showZoneForm && (
                                <Marker
                                    position={selectedPosition}
                                    icon={L.divIcon({ html: '<div style="background-color: #339AF0; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>', className: 'temp-marker', iconSize: [16, 16] })}
                                >
                                    <Popup>
                                        <strong>New Zone Center</strong>
                                        <p>Click "Create New Zone" to finalize.</p>
                                    </Popup>
                                </Marker>
                            )}

                            {zones.map(zone => (
                                <React.Fragment key={zone.zone_id}>
                                    <Circle
                                        center={[zone.latitude, zone.longitude]}
                                        radius={zone.radius_meters}
                                        pathOptions={{
                                            color: zoneColors[zone.zone_type],
                                            fillColor: zoneColors[zone.zone_type],
                                            fillOpacity: 0.15,
                                            weight: 3,
                                            opacity: 0.8
                                        }}
                                    >
                                        <Popup className="modern-popup">
                                            <div className="popup-content">
                                                <div className="popup-header">
                                                    <h3>{zone.zone_name}</h3>
                                                    <span
                                                        className="risk-badge"
                                                        style={{ backgroundColor: riskColors[zone.risk_level] }}
                                                    >
                                                        {zone.risk_level}
                                                    </span>
                                                </div>
                                                <div className="zone-meta">
                                                    <span className="zone-type-tag" style={{ backgroundColor: zoneColors[zone.zone_type] }}>
                                                        {zone.zone_type}
                                                    </span>
                                                    <span className="zone-radius">{zone.radius_meters}m</span>
                                                </div>
                                                <div className="zone-stats-grid">
                                                    <div className="stat-item">
                                                        <span className="stat-label">Population</span>
                                                        <span className="stat-value">{zone.dog_population}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Vaccinated</span>
                                                        <span className="stat-value">{zone.vaccinated_dogs}</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Food</span>
                                                        <span className="stat-value">{zone.food_score}/10</span>
                                                    </div>
                                                    <div className="stat-item">
                                                        <span className="stat-label">Water</span>
                                                        <span className="stat-value">{zone.water_score}/10</span>
                                                    </div>
                                                </div>
                                                {zone.remarks && (
                                                    <div className="zone-remarks">
                                                        <p>📝 {zone.remarks}</p>
                                                    </div>
                                                )}

                                                {canEditZone(zone) && (
                                                    <div className="zone-actions">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => {
                                                                const newRisk = prompt('Enter new risk level (Low/Medium/High):', zone.risk_level);
                                                                if (newRisk && ['Low', 'Medium', 'High'].includes(newRisk)) {
                                                                    handleZoneUpdate(zone.zone_id, { risk_level: newRisk });
                                                                }
                                                            }}
                                                        >
                                                            Edit Risk Level
                                                        </button>
                                                        {userRole === 'admin' && (
                                                            <button
                                                                className="action-btn delete"
                                                                onClick={() => handleZoneDelete(zone.zone_id)}
                                                            >
                                                                Delete Zone
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Circle>

                                    <Marker
                                        position={[zone.latitude, zone.longitude]}
                                        icon={zoneIcons[zone.zone_type]}
                                    >
                                        <Popup>
                                            <div className="marker-popup">
                                                <strong>{zone.zone_name}</strong>
                                                <div className="marker-details">
                                                    {zone.zone_type} • {zone.risk_level} Risk
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </React.Fragment>
                            ))}
                        </MapContainer>
                    </div>
                </main>
            </div>

            {/* Zone Creation Modal */}
            {showZoneForm && (
                <div className="modern-modal-overlay">
                    <div className="modern-modal">
                        <div className="modal-header">
                            <h2>Create New Zone</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowZoneForm(false)}
                                disabled={loading}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="modern-form">
                            <div className="form-location-info">
                                📍 Position: {selectedPosition ? `${selectedPosition.lat.toFixed(4)}, ${selectedPosition.lng.toFixed(4)}` : 'N/A (Click map to set)'}
                            </div>
                            <div className="form-section">
                                <h4>Zone Configuration</h4>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Zone Name *</label>
                                        <input
                                            type="text"
                                            defaultValue={zoneFormRef.current.zone_name}
                                            onChange={(e) => handleInputChange('zone_name', e.target.value)}
                                            placeholder="Enter zone name"
                                            required
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Zone Type *</label>
                                        <select
                                            defaultValue={zoneFormRef.current.zone_type}
                                            onChange={(e) => handleInputChange('zone_type', e.target.value)}
                                            required
                                        >
                                            <option value="Danger">⚠️ Danger Zone</option>
                                            <option value="Feeding">🍽️ Feeding Point</option>
                                            <option value="Help">🆘 Help Region</option>
                                            <option value="Adoption">🏠 Adoption Hotspot</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label>Radius (meters) *</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.radius_meters}
                                            onChange={(e) => handleInputChange('radius_meters', e.target.value)}
                                            min="1"
                                            max="5000"
                                            required
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Risk Level *</label>
                                        <select
                                            defaultValue={zoneFormRef.current.risk_level}
                                            onChange={(e) => handleInputChange('risk_level', e.target.value)}
                                            required
                                        >
                                            <option value="Low">🟢 Low</option>
                                            <option value="Medium">🟡 Medium</option>
                                            <option value="High">🔴 High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Population Data</h4>
                                <div className="form-grid compact">
                                    <div className="form-field">
                                        <label>Total Dogs</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.dog_population}
                                            onChange={(e) => handleInputChange('dog_population', e.target.value)}
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Vaccinated</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.vaccinated_dogs}
                                            onChange={(e) => handleInputChange('vaccinated_dogs', e.target.value)}
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Sterilized</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.sterilized_dogs}
                                            onChange={(e) => handleInputChange('sterilized_dogs', e.target.value)}
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Rabies Cases</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.affected_by_rabies}
                                            onChange={(e) => handleInputChange('affected_by_rabies', e.target.value)}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h4>Resources & Notes</h4>
                                <div className="form-grid">
                                    <div className="form-field">
                                        <label>Food Score (0-10)</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.food_score}
                                            onChange={(e) => handleInputChange('food_score', e.target.value)}
                                            min="0"
                                            max="10"
                                            step="0.1"
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Water Score (0-10)</label>
                                        <input
                                            type="number"
                                            defaultValue={zoneFormRef.current.water_score}
                                            onChange={(e) => handleInputChange('water_score', e.target.value)}
                                            min="0"
                                            max="10"
                                            step="0.1"
                                        />
                                    </div>

                                    <div className="form-field full-width">
                                        <label>Remarks</label>
                                        <textarea
                                            defaultValue={zoneFormRef.current.remarks}
                                            onChange={(e) => handleInputChange('remarks', e.target.value)}
                                            rows="3"
                                            placeholder="Additional notes about this zone..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowZoneForm(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading-spinner"></span>
                                            Creating Zone...
                                        </>
                                    ) : (
                                        'Create Zone'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapEditable;