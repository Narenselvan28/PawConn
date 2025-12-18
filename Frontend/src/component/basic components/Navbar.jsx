import React, { useState, useEffect } from "react";
import { Dog, LogOut, LogIn, Eye, AlertTriangle, User, Home, List, PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PRIMARY_COLOR = "#D64740"; // Primary Brand Red
const ACCENT_COLOR = "#4ECDC4"; // Teal/Cyan

// Define PropTypes structure for clarity
// const NavbarPropTypes = {
//     isAuthenticated: PropTypes.bool.isRequired,
//     userRole: PropTypes.string,
//     onLogout: PropTypes.func.isRequired,
//     onLogin: PropTypes.func.isRequired,
//     onAdoptNavigate: PropTypes.func.isRequired,
//     onReportIncident: PropTypes.func.isRequired,
// };

const Navbar = ({ isAuthenticated, userRole, onLogout, onLogin, onAdoptNavigate, onReportIncident }) => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    // Effect to handle scroll animation
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const buttonText = isAuthenticated ? "Logout" : "Login";
    const ButtonIcon = isAuthenticated ? LogOut : LogIn;

    const headerClasses = `
        sticky top-0 z-40 border-b border-gray-200 transition-all duration-300 ease-in-out
        ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'}
    `;

    // Dynamic Navigation Links for authenticated users
    const navLinks = [
        { path: '/home', icon: Home, label: 'Dashboard', roles: ['user', 'volunteer', 'admin'] },
        { path: '/reports', icon: List, label: 'Reports Portal', roles: ['volunteer', 'admin'] },
        { path: '/adoption-manager', icon: PawPrint, label: 'Ad Manager', roles: ['admin'] },
        { path: '/user-profile', icon: User, label: 'Profile', roles: ['user', 'volunteer', 'admin'] },
    ];

    // Determine which links to show based on user role
    const visibleLinks = navLinks.filter(link =>
        isAuthenticated && link.roles.includes(userRole)
    );

    return (
        <header className={headerClasses}>
            <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-3">

                {/* Logo & Branding */}
                <a onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
                    <div className="p-2 rounded-full transition group-hover:bg-red-100" style={{ background: scrolled ? '#D54644/10' : 'transparent' }}>
                        <Dog className="text-3xl" style={{ color: PRIMARY_COLOR }} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 tracking-tight transition">
                        PawBridge
                    </h1>
                </a>

                {/* Main Navigation Tabs (Visible only if logged in) */}
                {isAuthenticated && (
                    <nav className="hidden md:flex items-center gap-6 text-gray-600">
                        {visibleLinks.map(link => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="hover:text-gray-900 font-medium transition flex items-center gap-1"
                            >
                                <link.icon size={16} />{link.label}
                            </button>
                        ))}
                    </nav>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {/* Report Incident Button (Always visible) */}

                    {/* Browse Pets/Adoption Gallery */}
                    <button
                        onClick={onAdoptNavigate}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-white font-medium rounded-full
                                shadow-lg shadow-cyan-300/50 transition-all duration-300 hover:scale-[1.03]"
                        style={{ backgroundColor: ACCENT_COLOR }}
                    >
                        <Eye className="text-lg" />
                        Adopt
                    </button>

                    {/* Login/Logout Button */}
                    <button
                        onClick={isAuthenticated ? onLogout : onLogin}
                        className="flex items-center gap-2 px-5 py-2 text-white font-medium rounded-full
                                shadow-lg shadow-red-300/50 transition-all duration-300 hover:scale-[1.03]"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        <ButtonIcon className="text-lg" />
                        {buttonText}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
