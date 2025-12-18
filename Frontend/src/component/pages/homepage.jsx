// src/component/pages/LandingPage.jsx
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    PawPrint,
    MapPin,
    Heart,
    Users,
    CheckCircle,
    Lightbulb,
    MessageSquare,
    Clock,
    Send,
    Dog,
    X,
    Plus,
    AlertTriangle,
    Utensils,
    RefreshCw,
    Search,
    Filter,
} from "lucide-react";

// NOTE: Adjust path if necessary
import dogpana from "../../resources/Gemini_Generated_Image_2xzhuw2xzhuw2xzh.png";
import Navbar from "../basic components/Navbar";

const PRIMARY = "#D64740"; // Red
const ACCENT = "#4ECDC4"; // Teal/Cyan
const BG = "#F7FFF7";
const FONT_FAMILY = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue'";
const BASE_URL = 'http://localhost:5000';

// --- ALL HELPER COMPONENTS ARE DEFINED HERE ---

// --- Hero Section Component ---
function HeroSection({ onLogin, onAdoptNavigate }) {
    return (
        <section className="relative w-full h-[78vh] overflow-hidden">
            <img
                src={dogpana}
                alt="Rescue dog banner"
                className="w-full h-full object-cover brightness-75"
                style={{ filter: "brightness(0.75) saturate(1.05)" }}
            />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-10 -top-6 opacity-20 animate-float-slow">
                    <PawPrint className="w-28 h-28" style={{ color: PRIMARY }} />
                </div>
                <div className="absolute right-10 top-16 opacity-12 animate-float">
                    <Heart className="w-20 h-20" style={{ color: ACCENT }} />
                </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 animate-fade-in-up">
                <h1
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight"
                    style={{ fontFamily: FONT_FAMILY }}
                >
                    <span className="block">Together we turn</span>
                    <span className="block text-white/90">compassion into</span>
                    <span className="block" style={{ color: PRIMARY }}>
                        action.
                    </span>
                </h1>

                <p className="text-md sm:text-lg md:text-xl text-white/85 max-w-2xl mb-8 animate-fade-in-up delay-200">
                    PawBridge connects citizens, volunteers, shelters, and hospitals —
                    making rescue faster, adoptions kinder, and emergency care reachable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center animate-fade-in-up delay-400">
                    <button
                        onClick={onAdoptNavigate}
                        className="px-8 py-3 rounded-full font-semibold shadow-2xl transform transition hover:scale-[1.02] focus:ring-4 focus:ring-cyan-200"
                        style={{
                            backgroundColor: ACCENT, 
                            color: "#000",
                            boxShadow: "0 10px 30px rgba(78,205,196,0.2)",
                        }}
                    >
                        Browse Pets for Adoption
                    </button>

                    <button
                        onClick={onLogin}
                        className="px-8 py-3 rounded-full font-semibold shadow-2xl transform transition hover:scale-[1.02] focus:ring-4 focus:ring-red-200"
                        style={{
                            backgroundColor: PRIMARY,
                            color: "#fff",
                            boxShadow: "0 10px 30px rgba(214,100,64,0.18)",
                        }}
                    >
                        Login / Register
                    </button>
                </div>

                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 md:gap-10 mt-8 animate-fade-in-up delay-600">
                    {[{ label: "Reports handled", num: "120+" }, { label: "Adoptions", num: "38" }, { label: "Active volunteers", num: "22" }].map((s, i) => (
                        <div
                            key={i}
                            className="bg-white/95 backdrop-blur rounded-full py-2 px-5 shadow-md text-sm font-semibold text-gray-800 flex items-center gap-3 min-w-[160px] justify-center transition hover:shadow-lg"
                        >
                            <div className="text-sm">{s.label}:</div>
                            <div style={{ color: PRIMARY }} className="text-lg font-bold">{s.num}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Loading Paw Component ---
function LoadingPaw({ size = 64 }) {
    return (
        <div className="flex items-center justify-center">
            <div className="paw-wrap">
                <svg viewBox="0 0 24 24" width={size} height={size} fill={PRIMARY} className="paw-icon" aria-hidden>
                    <path d="M4 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm7-5c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm7.5 7.5c0-1.933-1.567-3.5-3.5-3.5-.847 0-1.622.298-2.212.788C15.09 10.581 15 10 14.5 9.5 13.667 8.667 12.5 8 11 8S8.333 8.667 7.5 9.5c-.5.5-.59 1.081-.288 1.788C6.123 10.798 5.348 10.5 4.5 10.5 2.567 10.5 1 12.067 1 14s1.567 3.5 3.5 3.5c.874 0 1.666-.335 2.267-.878C7.567 17.45 8.26 17.5 9 17.5c1.333 0 2.667-.5 4-1.5 1.333 1 2.667 1.5 4 1.5.74 0 1.433-.05 2.233-.378.6.543 1.393.878 2.267.878C22.433 17.5 24 15.933 24 14s-1.567-3.5-3.5-3.5z" />
                </svg>
            </div>
            <style jsx>{`
            .paw-wrap { width: ${size}px; height: ${size}px; display: grid; place-items: center; }
            .paw-icon { transform-origin: center; animation: paw-breathe 2200ms ease-in-out infinite; filter: drop-shadow(0 6px 18px rgba(214, 100, 80, 0.18)); }
            @keyframes paw-breathe { 0% { transform: translateY(0) scale(1); } 40% { transform: translateY(-6px) scale(1.03); } 80% { transform: translateY(0) scale(1); } }
            `}</style>
        </div>
    );
}

// --- About Section Component ---
function AboutSection() {
    return (
        <section id="mission" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-10 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: FONT_FAMILY }}>Our mission: bridge the gap between care and action</h2>
                    <p className="mt-4 text-gray-600 max-w-3xl mx-auto">PawBridge is a civic platform that empowers communities to report stray animal incidents, coordinate emergency responses with hospitals and volunteers, and create smoother adoption journeys. We build trust through transparency, speed through mapping, and compassion through community.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[{ icon: Users, title: "Community Powered", text: "Citizens and volunteers work together to rescue and rehabilitate — your report starts the chain of help." }, { icon: CheckCircle, title: "Transparent Process", text: "Every report and adoption is tracked — so you can see the outcome and impact." }, { icon: Lightbulb, title: "Data-Driven", text: "Maps, predictions, and smart assignment tools help responders reach crises faster." }].map((c, idx) => {
                        const Icon = c.icon;
                        return (<div key={idx} className="p-6 rounded-xl shadow-lg border hover:shadow-xl transition duration-300 transform hover:scale-[1.01] animate-fade-in delay-200" style={{ borderTop: `4px solid ${PRIMARY}`, background: "white" }}><div className="flex items-start gap-4"><Icon className="w-8 h-8 flex-shrink-0" style={{ color: PRIMARY }} /><div><h3 className="font-bold text-gray-900">{c.title}</h3><p className="text-gray-600 mt-2">{c.text}</p></div></div></div>);
                    })}
                </div>
            </div>
        </section>
    );
}

// --- Why Section Component ---
function WhySection() {
    return (
        <section id="why" className="py-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why PawBridge?</h2>
                    <p className="mt-3 text-gray-600 max-w-3xl mx-auto">Compassion is everywhere — but punctual help is not. PawBridge connects needs with action and guidance.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[{ icon: MapPin, title: "Smart Location Tracking", desc: "Pin incidents with GPS so volunteers and hospitals know exactly where help is needed." }, { icon: Heart, title: "Faster Adoptions", desc: "Verified shelters, clear profiles, and recommended matches help dogs find stable homes quickly." }, { icon: MessageSquare, title: "Community Alerts", desc: "Real-time alerts when a bite, injury, or urgent rescue is reported nearby." }].map((item, i) => {
                        const Icon = item.icon;
                        return (<div key={i} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:translate-y-[-4px] border-t-4 animate-fade-in delay-200" style={{ borderTopColor: PRIMARY }}><Icon className="w-10 h-10 mb-4" style={{ color: PRIMARY }} /><h3 className="text-xl font-bold mb-2">{item.title}</h3><p className="text-gray-600">{item.desc}</p></div>);
                    })}
                </div>
            </div>
        </section>
    );
}

// --- How It Works Section Component ---
function HowItWorks() {
    return (
        <section id="how" className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works — in three simple steps</h2>
                    <p className="mt-3 text-gray-600 max-w-2xl mx-auto">A straightforward workflow that moves from report to resolution with clarity and speed.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 items-start">
                    <div className="p-6 bg-gray-50 rounded-xl text-center border hover:shadow-md transition animate-fade-in delay-200">
                        <div className="flex items-center justify-center mb-4"><Send className="w-12 h-12" style={{ color: PRIMARY }} /></div>
                        <h3 className="font-semibold text-lg">1. Report</h3>
                        <p className="text-gray-600 mt-2">Submit a location, photo, and category — optionally anonymous.</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl text-center border hover:shadow-md transition animate-fade-in delay-400">
                        <div className="flex items-center justify-center mb-4"><Clock className="w-12 h-12" style={{ color: PRIMARY }} /></div>
                        <h3 className="font-semibold text-lg">2. Respond</h3>
                        <p className="text-gray-600 mt-2">Volunteers, shelters, and hospitals receive prioritized alerts and act quickly.</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl text-center border hover:shadow-md transition animate-fade-in delay-600">
                        <div className="flex items-center justify-center mb-4"><CheckCircle className="w-12 h-12" style={{ color: PRIMARY }} /></div>
                        <h3 className="font-semibold text-lg">3. Rehome & Recover</h3>
                        <p className="text-gray-600 mt-2">Dogs receive medical attention, rehabilitation, and adoption support where possible.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Impact Section Component ---
function ImpactSection() {
    return (
        <section id="impact" className="py-20 bg-red-50">
            <div className="max-w-7xl mx-auto px-6 text-center animate-fade-in-up">
                <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#111827" }}>Our Growing Impact</h2>
                <p className="text-gray-600 mt-3 max-w-3xl mx-auto">Every report becomes an action, and every adoption becomes a life changed.</p>

                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[{ icon: PawPrint, label: "Animals Rescued", count: "1,200+" }, { icon: Heart, label: "Adoptions Completed", count: "450" }, { icon: Users, label: "Volunteer Hours", count: "10,000+" }, { icon: CheckCircle, label: "Response Success", count: "98%" }].map((s, i) => {
                        const Icon = s.icon;
                        return (<div key={i} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-[1.05] border-b-4 animate-fade-in delay-200" style={{ borderBottomColor: PRIMARY }}><Icon className="w-10 h-10 mb-3" style={{ color: PRIMARY }} /><div className="text-3xl font-extrabold" style={{ color: PRIMARY }}>{s.count}</div><div className="text-gray-600 mt-1">{s.label}</div></div>);
                    })}
                </div>
            </div>
        </section>
    );
}

// --- Testimonials Component ---
function Testimonials() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-5xl mx-auto px-6 text-center animate-fade-in-up">
                <h3 className="text-2xl font-bold mb-6">Stories from the community</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {[{ quote: "I reported an injured dog and volunteers reached within an hour. Lifesaving.", author: "Priya — Volunteer" }, { quote: "Adopting through PawBridge felt safe and transparent — the process was smooth.", author: "Amit — Adopter" }, { quote: "The hospital list made it easy to find emergency care after a bite incident.", author: "Seema — Citizen" }].map((t, i) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition animate-fade-in delay-200"><p className="text-gray-700 italic">"{t.quote}"</p><div className="text-sm font-semibold mt-4 text-gray-900">{t.author}</div></div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Final CTA Component ---
function FinalCta() {
    return (
        <section className="py-16 bg-gradient-to-r from-white to-red-50">
            <div className="max-w-4xl mx-auto px-6 text-center animate-fade-in-up">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to make a difference?</h3>
                <p className="text-gray-600 mb-6">Create an account to report incidents, join volunteers, and help more dogs find safe homes.</p>
                <div className="flex justify-center gap-4">
                    <a href="/login" className="px-6 py-3 rounded-full font-semibold shadow-xl transition hover:shadow-2xl hover:scale-[1.02] focus:ring-4 focus:ring-red-200" style={{ backgroundColor: PRIMARY, color: "#fff" }}>
                        Login / Register
                    </a>
                    <a href="#how" className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
                        Learn how it works
                    </a>
                </div>
            </div>
        </section>
    );
}

// --- Footer Component ---
function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <PawPrint className="w-7 h-7" style={{ color: PRIMARY }} />
                            <div><div className="font-semibold text-lg">PawBridge</div><div className="text-xs text-gray-400">Compassion in action</div></div>
                        </div>
                        <p className="text-gray-400 max-w-md">PawBridge is a demo platform built for community-driven rescue and adoption coordination.</p>
                    </div>
                    <div><h4 className="text-red-200 font-semibold mb-3">Quick Links</h4><ul className="text-gray-400 space-y-2 text-sm"><li><a href="#how" className="hover:text-white transition">How it works</a></li><li><a href="#impact" className="hover:text-white transition">Impact</a></li><li><a href="#mission" className="hover:text-white transition">Mission</a></li></ul></div>
                    <div><h4 className="text-red-200 font-semibold mb-3">Contact</h4><p className="text-gray-400 text-sm">info@pawbridge.org<br />+91 98765 43210</p></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-8">© {new Date().getFullYear()} PawBridge. All rights reserved.</div>
            </div>
        </footer>
    );
}

// --------------------------------------------------------------------
// --- CITIZEN MODAL COMPONENTS (UPDATED FOR YOUR BACKEND) ---
// --------------------------------------------------------------------

const CitizenIncidentModal = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        landmark: '',
        description: '',
        category: 'other',
        email: '',
        phone: '',
        urgency: 'medium',
        preferred_action: 'other'
    });

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');

        try {
            const response = await fetch(`${BASE_URL}/api/citizen/reports`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    title: formData.title || `Citizen Report - ${formData.category}`
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Incident reported successfully! Our team will respond soon.');
                // Reset form
                setFormData({
                    title: '',
                    location: '',
                    landmark: '',
                    description: '',
                    category: 'other',
                    email: '',
                    phone: '',
                    urgency: 'medium',
                    preferred_action: 'other'
                });
                setTimeout(onClose, 2000);
            } else {
                setStatus(`Error: ${data.message || 'Failed to submit report'}`);
            }
        } catch (err) {
            setStatus('Error: Unable to connect to server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <AlertTriangle size={24} className="mr-2 text-red-600" /> 
                            Report Animal Incident
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Report injured, abused, or distressed animals anonymously
                    </p>
                </div>

                <div className="p-6">
                    {status && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${
                            status.includes('Error') 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Incident Type *
                            </label>
                            <select 
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                required 
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="">Select incident type</option>
                                <option value="injury">Injury/Medical Emergency</option>
                                <option value="abuse">Abuse/Cruelty</option>
                                <option value="neglect">Neglect/Starvation</option>
                                <option value="abandonment">Abandonment</option>
                                <option value="harassment">Harassment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title/Summary *
                            </label>
                            <input 
                                type="text" 
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                required 
                                placeholder="Brief description of the incident"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location *
                            </label>
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                required 
                                placeholder="Street address, area, or landmark"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Landmark (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={formData.landmark}
                                onChange={(e) => handleInputChange('landmark', e.target.value)}
                                placeholder="Nearby shop, building, or landmark"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                required 
                                placeholder="Describe the animal's condition, behavior, and the situation..."
                                rows="4"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Optional)
                                </label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="For updates"
                                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone (Optional)
                                </label>
                                <input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="For urgent contact"
                                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Your report is anonymous. Contact details are optional and only used for follow-up if needed.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ backgroundColor: PRIMARY }} 
                            className="w-full py-3 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <RefreshCw size={18} className="animate-spin mr-2" />
                                    Submitting...
                                </div>
                            ) : (
                                'Submit Incident Report'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const CitizenFeedModal = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        location: '',
        landmark: '',
        description: '',
        email: '',
        phone: ''
    });

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');

        try {
            const response = await fetch(`${BASE_URL}/api/citizen/feed-requests`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Feed request submitted successfully! Volunteers will be notified.');
                setFormData({
                    location: '',
                    landmark: '',
                    description: '',
                    email: '',
                    phone: ''
                });
                setTimeout(onClose, 2000);
            } else {
                setStatus(`Error: ${data.message || 'Failed to submit request'}`);
            }
        } catch (err) {
            setStatus('Error: Unable to connect to server. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <Utensils size={24} className="mr-2" style={{ color: ACCENT }} /> 
                            Request Food/Water Assistance
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Report animals in need of food or water in your area
                    </p>
                </div>

                <div className="p-6">
                    {status && (
                        <div className={`p-3 rounded-lg mb-4 text-sm ${
                            status.includes('Error') 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location *
                            </label>
                            <input 
                                type="text" 
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                required 
                                placeholder="Where are the animals located?"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Landmark (Optional)
                            </label>
                            <input 
                                type="text" 
                                value={formData.landmark}
                                onChange={(e) => handleInputChange('landmark', e.target.value)}
                                placeholder="Nearby shop, building, or landmark"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                required 
                                placeholder="Describe the animals, their condition, and how many need help..."
                                rows="3"
                                className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (Optional)
                                </label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="For updates"
                                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone (Optional)
                                </label>
                                <input 
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="For contact"
                                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> Local volunteers will be notified to provide assistance. Your contact details are optional.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ backgroundColor: ACCENT, color: '#000' }} 
                            className="w-full py-3 font-bold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <RefreshCw size={18} className="animate-spin mr-2" />
                                    Submitting...
                                </div>
                            ) : (
                                'Submit Feed Request'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------
// --- ADOPTION GALLERY POPUP COMPONENT ---
// --------------------------------------------------------------------

const AdoptionGalleryModal = ({ isOpen, onClose }) => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchPets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${BASE_URL}/api/adoptions`);
            if (!response.ok) throw new Error('Failed to fetch pets');
            const data = await response.json();
            setPets(data);
        } catch (err) {
            setError('Failed to load pets. Please try again later.');
            console.error('Error fetching pets:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useMemo(() => {
        if (isOpen) {
            fetchPets();
        }
    }, [isOpen, fetchPets]);

    const filteredPets = useMemo(() => {
        return pets.filter(pet => {
            const matchesSearch = pet.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                pet.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                pet.location?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || pet.type === filterType;
            return matchesSearch && matchesType && pet.status === 'available';
        });
    }, [pets, searchTerm, filterType]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'adopted': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Dog size={28} className="mr-3" style={{ color: PRIMARY }} />
                            Pets Available for Adoption
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-500 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Find your perfect furry companion from our rescued animals
                    </p>
                    
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, type, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="dog">Dogs</option>
                                <option value="cat">Cats</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <LoadingPaw size={80} />
                            <span className="ml-4 text-gray-600">Loading pets...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                            <p className="text-red-600">{error}</p>
                            <button 
                                onClick={fetchPets}
                                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredPets.length === 0 ? (
                        <div className="text-center py-12">
                            <Dog size={64} className="mx-auto text-gray-400 mb-4" />
                            <h4 className="text-xl font-semibold text-gray-600 mb-2">No pets found</h4>
                            <p className="text-gray-500">
                                {searchTerm || filterType !== 'all' 
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'No pets are currently available for adoption'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPets.map((pet) => (
                                <div key={pet.adoption_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                                    {/* Pet Image */}
                                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                                        {pet.photo_url ? (
                                            <img 
                                                src={pet.photo_url} 
                                                alt={pet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                <Dog size={64} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pet.status)}`}>
                                                {pet.status.charAt(0).toUpperCase() + pet.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pet Info */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-gray-900">{pet.name}</h4>
                                            <span className="text-sm text-gray-500 capitalize">{pet.gender}</span>
                                        </div>
                                        
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Type:</span>
                                                <span className="ml-2 capitalize">{pet.type}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Age:</span>
                                                <span className="ml-2">{pet.age}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin size={14} className="mr-1" />
                                                <span>{pet.location}</span>
                                            </div>
                                        </div>

                                        {pet.medical_status && (
                                            <div className="mb-3">
                                                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                                                    Medical: {pet.medical_status}
                                                </span>
                                            </div>
                                        )}

                                        {pet.rescue_story && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                {pet.rescue_story}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">
                                                Posted {new Date(pet.date_posted).toLocaleDateString()}
                                            </span>
                                            <button 
                                                className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
                                                style={{ backgroundColor: ACCENT, color: '#000' }}
                                                onClick={() => {
                                                    // You can add adoption inquiry logic here
                                                    alert(`Interested in adopting ${pet.name}? Please login to contact the shelter.`);
                                                }}
                                            >
                                                Inquire
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            Showing {filteredPets.length} of {pets.filter(p => p.status === 'available').length} available pets
                        </span>
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------
// --- FLOATING CTA COMPONENT ---
// --------------------------------------------------------------------

const FloatingCta = ({ openIncident, openFeed, openAdoption }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-40">
            {isOpen && (
                <div className="flex flex-col space-y-3 mb-3 items-end animate-fade-in-up">
                    <button 
                        onClick={() => { openIncident(); setIsOpen(false); }} 
                        className="flex items-center px-4 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:scale-105 border-2 border-white"
                    >
                        <AlertTriangle size={18} className="mr-2"/> 
                        Report Incident
                    </button>
                    <button 
                        onClick={() => { openFeed(); setIsOpen(false); }} 
                        className="flex items-center px-4 py-3 bg-cyan-500 text-black font-semibold rounded-full shadow-lg hover:bg-cyan-600 transition-all transform hover:scale-105 border-2 border-white"
                    >
                        <Utensils size={18} className="mr-2"/> 
                        Need Food/Water
                    </button>
                    <button 
                        onClick={() => { openAdoption(); setIsOpen(false); }} 
                        className="flex items-center px-4 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-105 border-2 border-white"
                    >
                        <Dog size={18} className="mr-2"/> 
                        Browse Pets
                    </button>
                </div>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ backgroundColor: PRIMARY }}
                className="w-16 h-16 rounded-full text-white shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center border-4 border-white"
            >
                <Plus size={28} className={isOpen ? 'rotate-45 transition-transform duration-300' : 'transition-transform duration-300'} />
            </button>
        </div>
    );
};

// --- END ALL HELPER COMPONENTS ---

export default function LandingPage() {
    const [loading, setLoading] = useState(true);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
    
    const navigate = useNavigate();

    // Initialize loading state without useEffect
    const initializeApp = useCallback(() => {
        const timer = setTimeout(() => setLoading(false), 1600);
        return () => clearTimeout(timer);
    }, []);

    // Use useMemo to initialize on component mount
    useMemo(() => {
        initializeApp();
    }, [initializeApp]);

    const handleLogin = useCallback(() => {
        navigate('/login');
    }, [navigate]);

    const handleAdoptNavigate = useCallback(() => {
        setIsAdoptionModalOpen(true);
    }, []);

    const openIncidentModal = useCallback(() => {
        setIsIncidentModalOpen(true);
    }, []);

    const openFeedModal = useCallback(() => {
        setIsFeedModalOpen(true);
    }, []);

    const openAdoptionModal = useCallback(() => {
        setIsAdoptionModalOpen(true);
    }, []);

    const closeIncidentModal = useCallback(() => {
        setIsIncidentModalOpen(false);
    }, []);

    const closeFeedModal = useCallback(() => {
        setIsFeedModalOpen(false);
    }, []);

    const closeAdoptionModal = useCallback(() => {
        setIsAdoptionModalOpen(false);
    }, []);

    return (
        <div className="min-h-screen" style={{ fontFamily: FONT_FAMILY, background: BG }}>
            {/* CSS Animations & Smooth Scroll */}
            <style>{`
            html { scroll-behavior: smooth; }
            .animate-float { animation: float 8s ease-in-out infinite; }
            .animate-float-slow { animation: float 12s ease-in-out infinite; }
            @keyframes float { 0% { transform: translateY(0) rotate(0deg); opacity: 0.9; } 50% { transform: translateY(-14px) rotate(6deg); opacity: 0.7; } 100% { transform: translateY(0) rotate(0deg); opacity: 0.9; } }
            .animate-fade-in { animation: fade-in 0.8s ease-out forwards; opacity: 0; }
            .animate-fade-in-up { animation: fade-in-up 0.9s ease-out forwards; opacity: 0; }
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .delay-200 { animation-delay: 0.2s; } .delay-400 { animation-delay: 0.4s; } .delay-600 { animation-delay: 0.6s; }
            .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>

            <Navbar onLogin={handleLogin} onAdoptNavigate={handleAdoptNavigate} />

            {/* Loading paw splash */}
            {loading ? (
                <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-white">
                    <LoadingPaw size={90} />
                    <div className="mt-6 text-gray-600">Warming up the wagging tails…</div>
                </div>
            ) : (
                <>
                    <main className="w-full">
                        <HeroSection onLogin={handleLogin} onAdoptNavigate={handleAdoptNavigate} />
                        <AboutSection />
                        <WhySection />
                        <HowItWorks />
                        <ImpactSection />
                        <Testimonials />
                        <FinalCta />
                    </main>

                    <Footer />

                    {/* Floating CTA Button */}
                    <FloatingCta 
                        openIncident={openIncidentModal}
                        openFeed={openFeedModal}
                        openAdoption={openAdoptionModal}
                    />
                    
                    {/* Incident Report Modal */}
                    <CitizenIncidentModal 
                        isOpen={isIncidentModalOpen} 
                        onClose={closeIncidentModal}
                    />

                    {/* Feed Request Modal */}
                    
                    {/* Adoption Gallery Modal */}
                    <AdoptionGalleryModal
                        isOpen={isAdoptionModalOpen}
                        onClose={closeAdoptionModal}
                    />
                </>
            )}
        </div>
    );
}