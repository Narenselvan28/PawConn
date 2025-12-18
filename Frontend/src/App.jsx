import React from 'react';
import { Route, Routes, BrowserRouter, Navigate } from "react-router-dom";

// --- Import Components from /component/pages ---
import Homepage from "./component/pages/homepage.jsx";
import Login, { VolunteerDashboard } from "./component/pages/login.jsx"; 
import Reports from "./component/pages/reports.jsx";
import AdoptionGallery from "./component/pages/adopt.jsx";
import AdPostManager from "./component/pages/adoptionmanager.jsx";
import Home from "./component/pages/home.jsx";
import UserProfile from "./component/pages/userpage.jsx";
import IncidentReporter from "./component/pages/IncidentReport.jsx";
import AdminDashboard from './component/pages/AdminDashboard.jsx'; // Admin Dashboard
import FeedLogPortal from './component/pages/FeedPortalLog.jsx';
import EventsWorkshops from './component/pages/EventsWorkshops.jsx';
import MapEditable from './component/pages/MapEditable.jsx';

// --- Import Authentication/Structure from /src root ---
import { AuthProvider } from './context/AuthContext.jsx'; 
import ProtectedRoute from './context/ProtectedRoute.jsx'; 
import Layout from './Layout.jsx'; 

function App() {
    // Component wrapper that applies the consistent global layout (including Navbar and Auth protection)
    const WrappedRoute = (Component) => (
        <ProtectedRoute>
            <Layout> 
                {Component}
            </Layout>
        </ProtectedRoute>
    );

    // Component wrapper that applies the consistent global layout (WITHOUT Auth protection)
    const PublicLayoutRoute = (Component) => (
        <Layout>
            {Component}
        </Layout>
    );

    return (
        <div className="min-h-screen antialiased">
            <AuthProvider> 
                <BrowserRouter>
                    <Routes>
                        
                        {/* 1. PUBLIC ROUTES: Accessible to everyone (No Layout or Protection) */}
                        <Route path="/" element={<Homepage />} />
                        <Route path="/login" element={<Login />} />
                        
                        {/* NEW: Admin Dashboard is now PUBLIC but gets Navbar/Context access */}
                        <Route path="/admin-dashboard" element={PublicLayoutRoute(<AdminDashboard />)} />

                        {/* 2. PROTECTED ROUTES: Wrapped in Layout + ProtectedRoute */}
                        <Route path="/reports" element={WrappedRoute(<Reports />)} />
                        <Route path="/adoption-manager" element={WrappedRoute(<AdPostManager />)} />
                        <Route path="/adoption-gallery" element={WrappedRoute(<AdoptionGallery />)} />
                        <Route path="/volunteerdashboard" element={WrappedRoute(<VolunteerDashboard />)} />
                        <Route path="/home" element={WrappedRoute(<Home />)} />
                        <Route path="/events-workshops" element={WrappedRoute(<EventsWorkshops />)} />
                        <Route path="/user-profile" element={WrappedRoute(<UserProfile />)} />
                        <Route path="/Incidents" element={WrappedRoute(<IncidentReporter />)} />
                        <Route path="/feedings" element={WrappedRoute(<FeedLogPortal />)} />
                        <Route path="/maps-edit" element={WrappedRoute(<MapEditable />)} />
                        {/* Fallback route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </div>
    );
}

export default App;
