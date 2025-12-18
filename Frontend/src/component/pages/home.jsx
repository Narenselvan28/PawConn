// ====================================================================
// frontend/pages/Home.jsx - IMPROVED QUICK ACTIONS
// ====================================================================

import React, { useMemo, useEffect, useState } from "react";
import {
    Dog, Heart, List, PawPrint, Users, AlertTriangle, MapPin,
    Plus, ArrowRight, User, Clock, TrendingUp, Eye, Calendar,
    Shield, Zap, MessageCircle, Star, Target, Utensils, Bell,
    Settings, Search, Filter, ChevronRight, Activity, Award,
    BarChart3, CalendarDays, ShieldCheck, FileText, GalleryThumbnails,
    History, Users2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuthApi } from '../../hooks/useAuthApi.jsx';

// --- Theme & Style Constants ---
const PRIMARY_COLOR = '#8D6E63'; // Mocha Brown
const ACCENT_COLOR = '#4ECDC4'; // Teal/Cyan
const SECONDARY_COLOR = '#667EEA'; // Purple
const SUCCESS_COLOR = '#10B981'; // Green
const WARNING_COLOR = '#F59E0B'; // Orange
const DANGER_COLOR = '#EF4444'; // Red

// --- Helper Components ---
const StatCard = ({ icon: Icon, label, count, color, loading, trend, subtitle }) => (
    <div className="group p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Colored accent bar */}
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }}></div>

        <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    {trend && (
                        <div className={`flex items-center text-xs px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            <TrendingUp size={10} className={trend > 0 ? '' : 'rotate-180'} />
                            <span className="ml-1">{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                        {subtitle && <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>}
                    </div>
                ) : (
                    <div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
                        {subtitle && (
                            <p className="text-sm text-gray-500">{subtitle}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="p-3 rounded-xl bg-opacity-10 group-hover:scale-110 transition-transform duration-300"
                style={{
                    backgroundColor: `${color}15`,
                    border: `1px solid ${color}20`
                }}>
                <Icon size={24} style={{ color }} />
            </div>
        </div>
    </div>
);

const ActionCard = ({ icon: Icon, title, description, color, route, badge, onClick, featured, stats }) => (
    <div
        onClick={onClick}
        className={`group p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative overflow-hidden ${featured
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg'
                : 'bg-white border-gray-100 shadow-sm hover:shadow-xl'
            }`}
    >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Feature badge */}
        {featured && (
            <div className="absolute top-4 right-4">
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    <Zap size={12} />
                    <span>Most Used</span>
                </div>
            </div>
        )}

        <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${featured ? 'bg-white shadow-md' : 'bg-white shadow-sm'
                    }`} style={{
                        border: `2px solid ${color}20`
                    }}>
                    <Icon size={28} style={{ color }} />
                </div>
                {badge && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full text-white shadow-sm"
                        style={{ backgroundColor: color }}>
                        {badge}
                    </span>
                )}
            </div>

            <h3 className={`text-xl font-bold mb-3 ${featured ? 'text-gray-900' : 'text-gray-900'}`}>{title}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>

            {/* Stats row for featured cards */}
            {stats && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center text-sm font-semibold group-hover:underline" style={{ color }}>
                    <span>Get Started</span>
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
                {featured && (
                    <div className="text-xs text-gray-400">
                        Updated today
                    </div>
                )}
            </div>
        </div>
    </div>
);

const RecentActivityItem = ({ icon: Icon, title, time, type, user, urgent }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-200 bg-white hover:shadow-sm group">
        <div className={`p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 ${urgent ? 'bg-red-100 text-red-600' :
                type === 'report' ? 'bg-blue-100 text-blue-600' :
                    type === 'adoption' ? 'bg-green-100 text-green-600' :
                        type === 'incident' ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
            }`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
            <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500">{time}</p>
                {urgent && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Urgent
                    </span>
                )}
            </div>
        </div>
        {user && (
            <div className="text-xs text-gray-400 hidden sm:block">{user}</div>
        )}
    </div>
);

const NavigationPill = ({ icon: Icon, label, path, currentPath, onClick }) => {
    const isActive = currentPath === path;
    return (
        <button
            onClick={() => onClick(path)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
        >
            <Icon size={16} />
            <span className="font-medium text-sm">{label}</span>
        </button>
    );
};

// --- Main Component ---
export default function Home() {
    const { user, userRole } = useAuth();
    const navigate = useNavigate();
    const { get } = useAuthApi();

    const [stats, setStats] = useState({
        reportsSubmitted: 0,
        adoptionsFollowed: 0,
        volunteerHours: 0,
        nearbyIncidents: 0,
        pendingReports: 0,
        availablePets: 0,
        activeEvents: 3,
        completedTasks: 12
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch user-specific stats
                const userStats = await get('/api/users/profile');

                // Fetch general stats that don't require auth
                const [reportsData, adoptionsData, incidentsData] = await Promise.all([
                    get('/api/reports').catch(() => []),
                    get('/api/adoptions').catch(() => []),
                    get('/api/incidents').catch(() => [])
                ]);

                // Calculate stats based on user role and data
                const userReports = Array.isArray(reportsData) ?
                    reportsData.filter(report => report.postedBy === user?.id) : [];

                const userAdoptions = Array.isArray(adoptionsData) ?
                    adoptionsData.filter(adopt => adopt.postedBy === user?.id) : [];

                const pendingReportsCount = Array.isArray(reportsData) ?
                    reportsData.filter(report => report.status?.toLowerCase() === 'pending').length : 0;

                const availablePetsCount = Array.isArray(adoptionsData) ?
                    adoptionsData.filter(adopt => adopt.status === 'available').length : 0;

                const nearbyIncidentsCount = Array.isArray(incidentsData) ?
                    incidentsData.filter(incident => incident.urgency === 'High').length : 0;

                setStats({
                    reportsSubmitted: userReports.length,
                    adoptionsFollowed: userAdoptions.length,
                    volunteerHours: userStats?.volunteerHours || 0,
                    nearbyIncidents: nearbyIncidentsCount,
                    pendingReports: pendingReportsCount,
                    availablePets: availablePetsCount,
                    activeEvents: 3,
                    completedTasks: userReports.length + userAdoptions.length
                });

                // Enhanced recent activity with more realistic data
                const activity = [
                    {
                        icon: AlertTriangle,
                        title: 'High-priority incident reported near Central Park',
                        time: '2 hours ago',
                        type: 'incident',
                        user: 'Community',
                        urgent: true
                    },
                    {
                        icon: Heart,
                        title: 'Buddy the Labrador found a forever home!',
                        time: '1 day ago',
                        type: 'adoption',
                        user: 'Sarah M.'
                    },
                    {
                        icon: Users,
                        title: 'New volunteer John joined the rescue team',
                        time: '2 days ago',
                        type: 'volunteer',
                        user: 'Team'
                    },
                    {
                        icon: ShieldCheck,
                        title: 'Monthly safety protocol updated successfully',
                        time: '3 days ago',
                        type: 'update',
                        user: 'Admin'
                    }
                ];
                setRecentActivity(activity);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                // Enhanced fallback data
                setStats({
                    reportsSubmitted: 12,
                    adoptionsFollowed: 8,
                    volunteerHours: 67,
                    nearbyIncidents: 3,
                    pendingReports: 7,
                    availablePets: 15,
                    activeEvents: 3,
                    completedTasks: 20
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user, get]);

    const displayName = user?.name || userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Citizen';
    const welcomeMessage = `Welcome back, ${displayName.split(' ')[0]}!`;
    const isStaffOrVolunteer = userRole === 'admin' || userRole === 'volunteer';

    // Enhanced navigation pills for quick access
    const navigationPills = [
        { icon: List, label: 'Reports', path: '/reports' },
        { icon: Dog, label: 'Adoptions', path: '/adoption-manager' },
        { icon: User, label: 'Profile', path: '/user-profile' },
        { icon: Utensils, label: 'Feedings', path: '/feedings' },
        { icon: MapPin, label: 'Maps', path: '/maps-edit' },
    ];

    // Enhanced Action Cards with better content and stats
    const actionCards = useMemo(() => {
        const cards = [
            {
                icon: AlertTriangle,
                title: "Report Incident",
                description: "Quickly document and submit animal emergencies, strays, or welfare concerns in your area.",
                color: DANGER_COLOR,
                route: '/reports',
                badge: stats.nearbyIncidents > 0 ? `${stats.nearbyIncidents} urgent` : 'No active',
                featured: true,
                stats: [
                    { value: stats.reportsSubmitted, label: 'Your Reports' },
                    { value: stats.nearbyIncidents, label: 'Active' },
                    { value: '5min', label: 'Avg. Time' }
                ]
            },
            {
                icon: GalleryThumbnails,
                title: "Adoption Gallery",
                description: "Browse through adorable pets seeking loving homes. Filter by type, age, and special needs.",
                color: SUCCESS_COLOR,
                route: '/adoption-manager',
                badge: `${stats.availablePets} available`,
                featured: true,
                stats: [
                    { value: stats.availablePets, label: 'Available' },
                    { value: stats.adoptionsFollowed, label: 'Following' },
                    { value: '12', label: 'New This Week' }
                ]
            },

            {
                icon: CalendarDays,
                title: "Events & Workshops",
                description: "Join upcoming animal welfare events, training workshops, and community volunteering opportunities.",
                color: WARNING_COLOR,
                route: '/events-workshops',
                badge: `${stats.activeEvents} upcoming`,
                stats: [
                    { value: stats.activeEvents, label: 'Upcoming' },
                    { value: '24', label: 'Participants' },
                    { value: '3', label: 'This Month' }
                ]
            }
        ];

        // Add staff-only cards
        if (isStaffOrVolunteer) {
            cards.push(
                {
                    icon: FileText,
                    title: "Manage Reports",
                    description: "Review, assign, and track all incident reports. Prioritize urgent cases and coordinate responses.",
                    color: PRIMARY_COLOR,
                    route: '/reports',
                    badge: stats.pendingReports > 0 ? `${stats.pendingReports} pending` : 'All clear',
                    stats: [
                        { value: stats.pendingReports, label: 'Pending' },
                        { value: '8', label: 'Assigned' },
                        { value: '24h', label: 'Avg. Response' }
                    ]
                },
                {
                    icon: Users2,
                    title: "Maps",
                    description: "Visualize volunteer locations, track outreach efforts, and optimize resource allocation  .",
                    color: ACCENT_COLOR,
                    route: '/maps',
                    badge: '12 active',
                    stats: [
                        { value: '12', label: 'Volunteers' },
                        { value: '45', label: 'Tasks' },
                        { value: '92%', label: 'Completion' }
                    ]
                }
            );
        }

        return cards;
    }, [isStaffOrVolunteer, stats, userRole]);

    const statCards = [
        
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Enhanced Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100">
                                    <PawPrint size={32} style={{ color: PRIMARY_COLOR }} />
                                </div>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                        {welcomeMessage}
                                    </h1>
                                    <p className="text-lg text-gray-600 mt-2">
                                        Ready to make a difference today?
                                    </p>
                                </div>
                            </div>

                            {/* Quick Navigation Pills */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {navigationPills.map((nav, index) => (
                                    <NavigationPill
                                        key={index}
                                        {...nav}
                                        currentPath={window.location.pathname}
                                        onClick={handleNavigation}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* User Profile Section */}
                        <div className="flex items-center space-x-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Welcome back</p>
                                <p className="font-semibold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500 capitalize mt-1">{userRole || 'Animal Friend'}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {displayName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid with Improved Layout */}
                

                {/* Enhanced Quick Actions Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Quick Actions</h2>
                            <p className="text-gray-600 mt-2 text-lg">Everything you need in one place</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">
                            <Zap size={20} className="text-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-700">Most Used</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {actionCards.map((card, index) => (
                            <ActionCard
                                key={index}
                                {...card}
                                onClick={() => navigate(card.route)}
                            />
                        ))}
                    </div>
                </div>

                {/* Enhanced Activity & Profile Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                    <p className="text-gray-600 text-sm mt-1">Latest updates from the community</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter size={18} className="text-gray-400" />
                                    <Eye size={18} className="text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {recentActivity.map((activity, index) => (
                                    <RecentActivityItem key={index} {...activity} />
                                ))}
                            </div>
                            <button className="w-full mt-6 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium flex items-center justify-center">
                                View All Activity
                                <ChevronRight size={16} className="ml-2" />
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Profile & Resources */}
                    <div className="space-y-6">
                        {/* Enhanced Profile Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    {displayName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{displayName}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{userRole || 'Animal Friend'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Member since</span>
                                    <span className="font-medium text-gray-900">{new Date().getFullYear()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Impact Level</span>
                                    <div className="flex items-center space-x-1">
                                        <Award size={16} className="text-yellow-500" />
                                        <span className="font-medium text-gray-900">Hero</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-600">Community Score</span>
                                    <div className="flex items-center space-x-1">
                                        <Star size={16} className="text-yellow-500" />
                                        <span className="font-medium text-gray-900">4.8/5</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/user-profile')}
                                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                            >
                                <User size={18} className="mr-2" />
                                Manage Profile
                            </button>
                        </div>
                        {/* Enhanced Resources Card */}
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="relative z-10">
                                <ShieldCheck size={32} className="mb-4 opacity-90" />
                                <h3 className="text-xl font-bold mb-2">Emergency Support</h3>
                                <p className="text-cyan-100 text-sm mb-6 leading-relaxed">
                                    24/7 emergency contacts, veterinary services, and immediate assistance guides
                                </p>
                                <div className="space-y-3">
                                    <button className="w-full px-4 py-3 bg-white text-cyan-600 font-medium rounded-xl hover:bg-cyan-50 transition-colors text-sm">
                                        Emergency Contacts
                                    </button>
                                    <button className="w-full px-4 py-3 bg-white/20 text-white font-medium rounded-xl hover:bg-white/30 transition-colors text-sm border border-white/30">
                                        Quick Guides
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}