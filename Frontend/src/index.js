import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Path to the main application file
import './index.css'; // Path to the global stylesheet

// Note: In modern React (v18+), ReactDOM.render is replaced by createRoot.

// The entry point where the application is mounted
const container = document.getElementById('root');
const root = createRoot(container);

// Render the application
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
