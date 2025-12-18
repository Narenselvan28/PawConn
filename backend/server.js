// ====================================================================
// server.js - FINAL CONSOLIDATED BACKEND CODE (MAX PUBLIC ACCESS + EVENTS + ZONES)
// ====================================================================

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { createPool } from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary'; 
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS: ", process.env.DB_PASS);


// --- 0. Cloudinary Setup and Multer Configuration ---
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'pawbridge_uploads', 
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage });

// --- 1. Database Connections ---
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: {
            freezeTableName: true
        },
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
);

const dbRaw = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const db = dbRaw; // Alias used by adoption/incident controllers

const DEMO_ADMIN_EMAIL = 'admin@pawbridge.com';
const DEMO_ADMIN_PASS = 'adminpass123';

// ====================================================================
// 2. MODEL DEFINITIONS (Unchanged)
// ====================================================================

const User = sequelize.define('users', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false, },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true, },
    password: { type: DataTypes.STRING(255), allowNull: false, },
    phone: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.STRING(255) },
    role: { type: DataTypes.ENUM('user', 'volunteer', 'admin'), defaultValue: 'user', },
    joined_on: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('active', 'inactive', 'banned'), defaultValue: 'active' },
}, { tableName: 'users', timestamps: false, });

const Report = sequelize.define('reports', {
    report_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
    location: { type: DataTypes.STRING(255), allowNull: false },
    landmark: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    photo_url: { type: DataTypes.STRING(255) },
    category: { type: DataTypes.ENUM('injury', 'abuse', 'neglect', 'harassment', 'abandonment', 'other', 'feed issue'), defaultValue: 'other' },
    visibility: { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' },
    status: { type: DataTypes.ENUM('pending', 'reviewed', 'in_progress', 'resolved', 'dismissed'), defaultValue: 'pending' },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    posted_by: { type: DataTypes.INTEGER, allowNull: true },
    date_reported: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'reports', timestamps: false, });

const Adoption = sequelize.define('adoptions', {
    adoption_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    age: { type: DataTypes.STRING(50) },
    gender: { type: DataTypes.ENUM('male', 'female', 'unknown'), defaultValue: 'unknown' },
    type: { type: DataTypes.ENUM('dog', 'cat', 'other') },
    medical_status: { type: DataTypes.STRING(255) },
    rescue_story: { type: DataTypes.TEXT },
    photo_url: { type: DataTypes.STRING(255) },
    follow_up: { type: DataTypes.TEXT },
    posted_by: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('available', 'pending', 'adopted', 'removed'), defaultValue: 'available' },
    adopted_by: { type: DataTypes.INTEGER, allowNull: true },
    date_posted: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    location: { type: DataTypes.STRING(255) },
}, { tableName: 'adoptions', timestamps: false, });

const Incident = sequelize.define('incidents', {
    incident_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    category: { type: DataTypes.ENUM('attack', 'injury', 'rescue_needed', 'harassment', 'neglect', 'disturbance', 'other') },
    location: { type: DataTypes.STRING(255) },
    landmark: { type: DataTypes.STRING(255) },
    date_reported: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    description: { type: DataTypes.TEXT },
    animal_identity: { type: DataTypes.STRING(150) },
    photo_url: { type: DataTypes.STRING(255) },
    urgency: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    preferred_action: { type: DataTypes.ENUM('rescue', 'medical_help', 'complaint', 'monitor', 'other') },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    posted_by: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'acknowledged', 'in_progress', 'resolved', 'dismissed'), defaultValue: 'pending' },
    remarks: { type: DataTypes.TEXT },
}, { tableName: 'incidents', timestamps: false, });

const FeedLog = sequelize.define('feed_log', {
    feed_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    feeder_id: { type: DataTypes.INTEGER, allowNull: false }, 
    location: { type: DataTypes.STRING(255), allowNull: false },
    landmark: { type: DataTypes.STRING(255) },
    food_type: { type: DataTypes.STRING(100) },
    quantity: { type: DataTypes.STRING(50) },
    photo_url: { type: DataTypes.STRING(255) },
    feed_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'feed_log', timestamps: false, });

const Event = sequelize.define('events', {
    event_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING(255) },
    event_date: { type: DataTypes.DATE, allowNull: false },
    posted_by: { type: DataTypes.INTEGER, allowNull: false }, 
    status: { type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'), defaultValue: 'upcoming' },
    category: { type: DataTypes.ENUM('workshop', 'vaccination', 'fundraiser', 'cleanup', 'other'), defaultValue: 'other' },
}, { tableName: 'events', timestamps: false, });

const Zone = sequelize.define('zones', {
    zone_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    zone_name: { type: DataTypes.STRING(100), allowNull: false },
    zone_type: { type: DataTypes.ENUM('Danger', 'Feeding', 'Help', 'Adoption'), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    radius_meters: { type: DataTypes.FLOAT, allowNull: false },
    dog_population: { type: DataTypes.INTEGER, defaultValue: 0 },
    affected_by_rabies: { type: DataTypes.INTEGER, defaultValue: 0 },
    bite_cases: { type: DataTypes.INTEGER, defaultValue: 0 },
    vaccinated_dogs: { type: DataTypes.INTEGER, defaultValue: 0 },
    sterilized_dogs: { type: DataTypes.INTEGER, defaultValue: 0 },
    food_score: { type: DataTypes.FLOAT, defaultValue: 0 },
    water_score: { type: DataTypes.FLOAT, defaultValue: 0 },
    risk_level: { type: DataTypes.ENUM('Low', 'Medium', 'High'), defaultValue: 'Low' },
    predicted_population_next_month: { type: DataTypes.INTEGER, defaultValue: 0 },
    predicted_risk_radius: { type: DataTypes.FLOAT },
    remarks: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'zones',
    timestamps: false,
    hooks: {
        beforeUpdate: (zone) => {
            zone.updated_at = new Date();
        }
    }
});

// ====================================================================
// 3. MODEL ASSOCIATIONS (Unchanged)
// ====================================================================
User.hasMany(Event, { foreignKey: 'posted_by', onDelete: 'CASCADE' });
Event.belongsTo(User, { foreignKey: 'posted_by', as: 'Poster' });

User.hasMany(Zone, { foreignKey: 'created_by', onDelete: 'CASCADE' });
Zone.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });

User.hasMany(FeedLog, { foreignKey: 'feeder_id', onDelete: 'CASCADE' });
FeedLog.belongsTo(User, { foreignKey: 'feeder_id', as: 'Feeder' });

User.hasMany(Report, { foreignKey: 'posted_by', onDelete: 'CASCADE' });
Report.belongsTo(User, { foreignKey: 'posted_by', as: 'Poster' });
User.hasMany(Report, { foreignKey: 'assigned_to', as: 'AssignedReports', onDelete: 'SET NULL' });
Report.belongsTo(User, { foreignKey: 'assigned_to', as: 'Assignee' });

User.hasMany(Adoption, { foreignKey: 'posted_by', onDelete: 'CASCADE' });
Adoption.belongsTo(User, { foreignKey: 'posted_by', as: 'Poster' });
Adoption.belongsTo(User, { foreignKey: 'adopted_by', as: 'Adopter', onDelete: 'SET NULL' });

User.hasMany(Incident, { foreignKey: 'posted_by', onDelete: 'CASCADE' });
Incident.belongsTo(User, { foreignKey: 'posted_by', as: 'Poster' });
User.hasMany(Incident, { foreignKey: 'assigned_to', as: 'AssignedIncidents', onDelete: 'SET NULL' });
Incident.belongsTo(User, { foreignKey: 'assigned_to', as: 'Assignee' });

// ====================================================================
// 4. MIDDLEWARE (Unchanged)
// ====================================================================
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message || 'Server Error' });
};

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized, token missing' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized, user not found' });
        }
        req.user = { id: user.user_id, role: user.role, email: user.email };
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Unauthorized, token invalid or expired' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, admin only' });
    }
};

const volunteerOrAdminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'volunteer')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, volunteer or admin only' });
    }
};

// ====================================================================
// 5. CONTROLLERS (FIXED: Upload controllers use correct model fields)
// ====================================================================

// --- 5.1 Users Controller (Unchanged) ---
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: role || 'user'
        });

        res.status(201).json({
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.user_id, user.role)
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        if (user.status !== 'active') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        res.json({
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.user_id, user.role)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, password, phone, address } = req.body;

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['joined_on', 'DESC']]
        });
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getSingleUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const adminUpdateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, phone, address, role, status } = req.body;

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();
        res.json({
            message: 'User updated successfully by Admin',
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent admin from deleting themselves
        if (user.user_id === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 5.2 Reports Controller (Public GET / Protected POST/PUT/DELETE) ---

// ✅ FIX: Controller for Report with file upload
const createReportWithUpload = async (req, res) => {
    try {
        const imageUrl = req.file?.path; 
        const { title, priority, location, landmark, description, category, visibility } = req.body;

        // Log to debug authentication and file presence
        // console.log('REQ USER:', req.user); 
        // console.log('REQ FILE:', req.file); 

        if (!req.user) { // Should be protected by middleware, but a safeguard
            return res.status(401).json({ message: 'Authentication required for upload.' });
        }

        if (!title || !location) {
            return res.status(400).json({ message: 'Title and location are required' });
        }

        const report = await Report.create({
            title,
            priority,
            location,
            landmark,
            description,
            photo_url: imageUrl, // ✅ Store Cloudinary URL here
            category,
            visibility,
            posted_by: req.user.id,
        });

        res.status(201).json({
            message: 'Report created successfully with photo',
            report
        });
    } catch (error) {
        console.error('Error creating report with upload:', error);
        res.status(500).json({ message: error.message });
    }
};

const getAllReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [['date_reported', 'DESC']],
            include: [
                { model: User, as: 'Poster', attributes: ['name', 'email'] },
                { model: User, as: 'Assignee', attributes: ['name', 'email', 'role'] }
            ]
        });
        res.json(reports);
    } catch (error) {
        console.error('Error in getAllReports:', error.message);
        res.status(500).json({ message: error.message });
    }
};

const getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Poster', attributes: ['name', 'email'] },
                { model: User, as: 'Assignee', attributes: ['name', 'email'] }
            ]
        });
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// Original createReport (for text-only or photo_url passed in body)
const createReport = async (req, res) => {
    try {
        const { title, priority, location, landmark, description, photo_url, category, visibility } = req.body;

        if (!title || !location) {
            return res.status(400).json({ message: 'Title and location are required' });
        }

        const report = await Report.create({
            title,
            priority,
            location,
            landmark,
            description,
            photo_url, 
            category,
            visibility,
            posted_by: req.user.id
        });
        res.status(201).json(report);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateReport = async (req, res) => {
    try {
        const allowedUpdates = { ...req.body };
        delete allowedUpdates.status;
        delete allowedUpdates.assigned_to;

        const [updated] = await Report.update(allowedUpdates, {
            where: {
                report_id: req.params.id,
                posted_by: req.user.id
            }
        });

        if (!updated) {
            return res.status(404).json({
                message: 'Report not found or not authorized to update'
            });
        }
        const updatedReport = await Report.findByPk(req.params.id);
        res.json(updatedReport);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteReport = async (req, res) => {
    try {
        const deleted = await Report.destroy({
            where: {
                report_id: req.params.id,
                // Allow deletion only if user is admin or the original poster
                ...(req.user.role !== 'admin' ? { posted_by: req.user.id } : {})
            }
        });
        if (deleted === 0) return res.status(404).json({ message: 'Report not found or not authorized' });
        res.json({ message: 'Report deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const adminUpdateReport = async (req, res) => {
    try {
        const { status, assigned_to, title, description, priority, location, category, visibility } = req.body;

        const updateObject = {};
        if (status) updateObject.status = status;
        if (assigned_to !== undefined) updateObject.assigned_to = assigned_to;
        if (title) updateObject.title = title;
        if (description) updateObject.description = description;
        if (priority) updateObject.priority = priority;
        if (location) updateObject.location = location;
        if (category) updateObject.category = category;
        if (visibility) updateObject.visibility = visibility;

        if (Object.keys(updateObject).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        const [updated] = await Report.update(updateObject, { where: { report_id: req.params.id } });
        if (!updated) return res.status(404).json({ message: 'Report not found or no changes made' });

        const updatedReport = await Report.findByPk(req.params.id);
        res.json({
            message: 'Report status and details updated successfully by Admin',
            report: updatedReport
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 5.3 Adoptions Controller (Public GET / Protected POST/PUT/DELETE) ---
const getAllAdoptions = async (req, res) => {
    try {
        const ads = await Adoption.findAll({
            order: [['date_posted', 'DESC']],
            include: [{ model: User, as: 'Poster', attributes: ['name', 'email'] }]
        });
        res.json(ads);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAdoptionById = async (req, res) => {
    try {
        const ad = await Adoption.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Poster', attributes: ['name', 'email'] },
                { model: User, as: 'Adopter', attributes: ['name', 'email'] }
            ]
        });
        if (!ad) return res.status(404).json({ message: 'Adoption not found' });
        res.json(ad);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createAdoption = async (req, res) => {
    try {
        const { name, age, gender, type, medical_status, rescue_story, photo_url, follow_up, location } = req.body;

        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        const posted_by = req.user.id;

        const ad = await Adoption.create({
            name, age, gender, type, medical_status, rescue_story, photo_url, follow_up, posted_by, location
        });

        res.status(201).json({
            message: 'Adoption created successfully',
            id: ad.adoption_id,
            adoption: ad
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateAdoption = async (req, res) => {
    try {
        const { id } = req.params;
        const updateObject = req.body;

        // Check if user is authorized to update
        if (req.user.role !== 'admin') {
            const adoption = await Adoption.findByPk(id);
            if (!adoption) {
                return res.status(404).json({ message: 'Adoption not found' });
            }
            if (adoption.posted_by !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to update this adoption' });
            }
        }

        const [updated] = await Adoption.update(updateObject, { where: { adoption_id: id } });

        if (updated === 0) return res.status(404).json({ message: 'Adoption not found or no changes made' });
        res.status(200).json({ message: 'Adoption updated successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteAdoption = async (req, res) => {
    try {
        // Check if user is authorized to delete
        if (req.user.role !== 'admin') {
            const adoption = await Adoption.findByPk(req.params.id);
            if (!adoption) {
                return res.status(404).json({ message: 'Adoption not found' });
            }
            if (adoption.posted_by !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to delete this adoption' });
            }
        }

        const deleted = await Adoption.destroy({ where: { adoption_id: req.params.id } });
        if (deleted === 0) return res.status(404).json({ message: 'Adoption not found' });
        res.json({ message: 'Adoption deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};
// --- 5.3.1 Adoption Photo Upload Controller ---
const createAdoptionWithUpload = async (req, res) => {
    try {
        const imageUrl = req.file?.path; 
        const {
            name, age, gender, type, medical_status, rescue_story,
            follow_up, location
        } = req.body;

        if (!req.user) { // Should be protected by middleware, but a safeguard
            return res.status(401).json({ message: 'Authentication required for upload.' });
        }
        
        if (!name || !type) {
            return res.status(400).json({ message: 'Name and type are required' });
        }

        const adoption = await Adoption.create({
            name,
            age,
            gender,
            type,
            medical_status,
            rescue_story,
            photo_url: imageUrl, // ✅ Store Cloudinary URL
            follow_up,
            location,
            posted_by: req.user.id
        });

        res.status(201).json({
            message: 'Adoption created successfully with photo',
            adoption
        });
    } catch (error) {
        console.error('Error creating adoption with upload:', error);
        res.status(500).json({ message: error.message });
    }
};
// --- 5.4 Incidents Controller (Public POST) ---
const getAllIncidents = async (req, res) => {
    try {
        const [rows] = await dbRaw.execute(`
            SELECT 
                i.*, 
                u.name AS postedByName, 
                a.name AS assignedToName
            FROM incidents i
            LEFT JOIN users u ON i.posted_by = u.user_id
            LEFT JOIN users a ON i.assigned_to = a.user_id
            ORDER BY i.date_reported DESC
        `);
        res.status(200).json(rows);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getIncidentById = async (req, res) => {
    try {
        const [rows] = await dbRaw.execute(`
            SELECT 
                i.*, 
                u.name AS postedByName, 
                a.name AS assignedToName
            FROM incidents i
            LEFT JOIN users u ON i.posted_by = u.user_id
            LEFT JOIN users a ON i.assigned_to = a.user_id
            WHERE i.incident_id = ?`,
            [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Incident not found' });
        res.status(200).json(rows[0]);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createIncident = async (req, res) => {
    try {
        const { category, location, landmark, email, phone, description, animal_identity, photo_url, urgency, preferred_action } = req.body;

        if (!category || !location) {
            return res.status(400).json({ message: 'Category and location are required' });
        }

        const posted_by = req.user ? req.user.id : null; // Can be null if posted anonymously
        const [result] = await dbRaw.execute(
            `INSERT INTO incidents (category, location, landmark, email, phone, description, animal_identity, photo_url, urgency, preferred_action, posted_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [category, location, landmark, email, phone, description, animal_identity, photo_url, urgency, preferred_action, posted_by]
        );
        res.status(201).json({
            message: 'Incident reported successfully',
            id: result.insertId
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const adminUpdateIncident = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigned_to, remarks, category, location, urgency } = req.body;

        let setClauses = [];
        let values = [];

        if (status) { setClauses.push('status = ?'); values.push(status); }
        if (assigned_to !== undefined) { setClauses.push('assigned_to = ?'); values.push(assigned_to); }
        if (remarks !== undefined) { setClauses.push('remarks = ?'); values.push(remarks); }
        if (category) { setClauses.push('category = ?'); values.push(category); }
        if (location) { setClauses.push('location = ?'); values.push(location); }
        if (urgency) { setClauses.push('urgency = ?'); values.push(urgency); }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for admin update' });
        }

        const updateQuery = `UPDATE incidents SET ${setClauses.join(', ')} WHERE incident_id = ?`;
        values.push(id);

        const [result] = await dbRaw.execute(updateQuery, values);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Incident not found or no changes made' });
        res.status(200).json({ message: `Incident ID ${id} updated successfully by Admin` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteIncident = async (req, res) => {
    try {
        const deleted = await Incident.destroy({ where: { incident_id: req.params.id } });
        if (deleted === 0) return res.status(404).json({ message: 'Incident not found' });
        res.json({ message: 'Incident deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 5.5 FeedLog Controller (Protected POST / Public GET) ---
const createFeedLog = async (req, res) => {
    try {
        const { location, landmark, food_type, quantity, photo_url, feed_time } = req.body;

        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
        }

        const feeder_id = req.user.id;

        const log = await FeedLog.create({
            feeder_id, location, landmark, food_type, quantity, photo_url, feed_time: feed_time || new Date()
        });

        res.status(201).json({
            message: 'Feed log recorded successfully',
            id: log.feed_id,
            feedLog: log
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAllFeedLogs = async (req, res) => {
    try {
        const logs = await FeedLog.findAll({
            order: [['feed_time', 'DESC']],
            include: [{ model: User, as: 'Feeder', attributes: ['name', 'email'] }]
        });
        res.json(logs);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteFeedLog = async (req, res) => {
    try {
        const deleted = await FeedLog.destroy({ where: { feed_id: req.params.id } });
        if (deleted === 0) return res.status(404).json({ message: 'Feed log not found' });
        res.json({ message: 'Feed log deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 5.6 Citizen Controller (NEW - Anonymous Report Submissions) ---
const createCitizenReport = async (req, res) => {
    try {
        const { title, location, landmark, description, category } = req.body; 

        if (!location) {
            return res.status(400).json({ message: 'Location is required' });
        }

        const report = await Report.create({
            title: title || `Citizen Report - ${new Date().toLocaleDateString()}`,
            location,
            landmark,
            description,
            category: category || 'other',
            priority: 'medium',
            visibility: 'public',
            posted_by: null, // Anonymous submission
            status: 'pending'
        });

        res.status(201).json({
            message: 'Citizen report submitted successfully',
            id: report.report_id,
            report: report
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 5.7 Events Controller (Unchanged) ---
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll({
            order: [['event_date', 'ASC']],
            include: [{ model: User, as: 'Poster', attributes: ['name', 'email'] }]
        });
        res.json(events);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id, {
            include: [{ model: User, as: 'Poster', attributes: ['name', 'email'] }]
        });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createEvent = async (req, res) => {
    try {
        const { title, description, location, event_date, category } = req.body;

        if (!title || !location || !event_date) {
            return res.status(400).json({ message: 'Title, location, and event date are required' });
        }

        const event = await Event.create({
            title, description, location, event_date, category, posted_by: req.user.id
        });

        res.status(201).json({
            message: 'Event created successfully',
            id: event.event_id,
            event: event
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateEvent = async (req, res) => {
    try {
        const [updated] = await Event.update(req.body, {
            where: {
                event_id: req.params.id,
                ...(req.user.role !== 'admin' ? { posted_by: req.user.id } : {})
            }
        });

        if (!updated) {
            return res.status(404).json({
                message: 'Event not found or not authorized to update'
            });
        }
        const updatedEvent = await Event.findByPk(req.params.id);
        res.json(updatedEvent);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteEvent = async (req, res) => {
    try {
        const deleted = await Event.destroy({
            where: {
                event_id: req.params.id,
                ...(req.user.role !== 'admin' ? { posted_by: req.user.id } : {})
            }
        });
        if (deleted === 0) return res.status(404).json({ message: 'Event not found or not authorized' });
        res.json({ message: 'Event deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// --- 5.8 Zones Controller (Unchanged) ---
const getAllZones = async (req, res) => {
    try {
        const zones = await Zone.findAll({
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'Creator', attributes: ['name', 'email'] }]
        });
        res.json(zones);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const getZoneById = async (req, res) => {
    try {
        const zone = await Zone.findByPk(req.params.id, {
            include: [{ model: User, as: 'Creator', attributes: ['name', 'email'] }]
        });
        if (!zone) return res.status(404).json({ message: 'Zone not found' });
        res.json(zone);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const createZone = async (req, res) => {
    try {
        const {
            zone_name, zone_type, latitude, longitude, radius_meters,
            dog_population, affected_by_rabies, bite_cases, vaccinated_dogs,
            sterilized_dogs, food_score, water_score, risk_level,
            predicted_population_next_month, predicted_risk_radius, remarks
        } = req.body;

        if (!zone_name || !zone_type || !latitude || !longitude || !radius_meters) {
            return res.status(400).json({
                message: 'Zone name, type, latitude, longitude, and radius are required'
            });
        }

        const zone = await Zone.create({
            zone_name, zone_type, latitude, longitude, radius_meters,
            dog_population, affected_by_rabies, bite_cases, vaccinated_dogs,
            sterilized_dogs, food_score, water_score, risk_level,
            predicted_population_next_month, predicted_risk_radius, remarks,
            created_by: req.user.id
        });

        res.status(201).json({
            message: 'Zone created successfully',
            id: zone.zone_id,
            zone: zone
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateZone = async (req, res) => {
    try {
        const [updated] = await Zone.update(req.body, {
            where: { zone_id: req.params.id }
        });

        if (!updated) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        const updatedZone = await Zone.findByPk(req.params.id);
        res.json(updatedZone);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteZone = async (req, res) => {
    try {
        const deleted = await Zone.destroy({ where: { zone_id: req.params.id } });
        if (deleted === 0) return res.status(404).json({ message: 'Zone not found' });
        res.json({ message: 'Zone deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ====================================================================
// 6. ROUTES (FIXED: Upload routes are now protected)
// ====================================================================

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- 6.1 Public Routes ---
app.post('/api/users/register', registerUser);
app.post('/api/users/login', loginUser);
app.get('/api/reports', getAllReports);
app.get('/api/reports/:id', getReportById);
app.get('/api/adoptions', getAllAdoptions);
app.get('/api/adoptions/:id', getAdoptionById);
app.get('/api/feed-logs', getAllFeedLogs);
app.get('/api/events', getAllEvents);
app.get('/api/events/:id', getEventById);
app.get('/api/zones', getAllZones);
app.get('/api/zones/:id', getZoneById);
app.post('/api/incidents', createIncident); 
app.get('/api/incidents', getAllIncidents);
app.get('/api/incidents/:id', getIncidentById);
app.post('/api/citizen/reports', createCitizenReport); 

// --- 6.2 Protected Routes ---
app.use(protect); // 🛑 All routes below this line require a valid JWT token.

// User Profile Routes
app.get('/api/users/profile', getUserProfile);
app.put('/api/users/profile', updateUserProfile);

// Protected POST/PUT/DELETE Routes
app.post('/api/reports', createReport);
app.post('/api/reports/upload', upload.single('photo'), createReportWithUpload); // ✅ PROTECTED upload
app.put('/api/reports/:id', updateReport);
app.delete('/api/reports/:id', deleteReport);

app.post('/api/adoptions', createAdoption);
app.post('/api/adoptions/upload', upload.single('photo'), createAdoptionWithUpload); // ✅ PROTECTED upload
app.put('/api/adoptions/:id', updateAdoption);
app.delete('/api/adoptions/:id', deleteAdoption);

app.post('/api/feed-logs', createFeedLog);
app.delete('/api/feed-logs/:id', deleteFeedLog);

app.post('/api/events', createEvent);
app.put('/api/events/:id', updateEvent);
app.delete('/api/events/:id', deleteEvent);

app.post('/api/zones', createZone);
app.put('/api/zones/:id', updateZone);
app.delete('/api/zones/:id', deleteZone);

// --- 6.3 Admin-Only Routes ---

app.use(adminOnly); // All routes below require admin role

app.get('/api/admin/users', getAllUsers);
app.get('/api/admin/users/:id', getSingleUser);
app.put('/api/admin/users/:id', adminUpdateUser);
app.delete('/api/admin/users/:id', deleteUser);

app.put('/api/admin/reports/:id', adminUpdateReport);

app.put('/api/admin/incidents/:id', adminUpdateIncident);
app.delete('/api/admin/incidents/:id', deleteIncident);

// ====================================================================
// 7. DATABASE INITIALIZATION & SERVER STARTUP
// ====================================================================

const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Sequelize connected to MySQL');

        await sequelize.sync({ alter: true }); 
        console.log('✅ All models synchronized');

        const adminExists = await User.findOne({ where: { email: DEMO_ADMIN_EMAIL } });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASS, 10);
            await User.create({
                name: 'Demo Admin',
                email: DEMO_ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Demo admin user created');
        } else {
            console.log('ℹ️ Demo admin user already exists');
        }

        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await initDatabase();
});

export default app;