// config.js - Application configuration

const CONFIG = {
    // Map settings
    MAP: {
        DEFAULT_ZOOM: 15,
        MAX_ZOOM: 19,
        MIN_ZOOM: 3,
        TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        UPDATE_INTERVAL: 3000, // 3 seconds
        MAX_HISTORY_POINTS: 1000,
        PATH_COLOR: '#00ffff',
        PATH_WEIGHT: 4,
        PATH_OPACITY: 0.8,
    },

    // GPS settings
    GPS: {
        ENABLE_HIGH_ACCURACY: true,
        TIMEOUT: 10000,
        MAXIMUM_AGE: 0,
        MIN_ACCURACY: 100, // meters
    },

    // UI settings
    UI: {
        ANIMATION_DURATION: 300,
        NOTIFICATION_DURATION: 3000,
        REFRESH_RATE: 1000, // 1 second for UI updates
    },

    // Battery settings
    BATTERY: {
        LOW_THRESHOLD: 20,
        CRITICAL_THRESHOLD: 5,
        UPDATE_INTERVAL: 5000, // 5 seconds
    },

    // Speed calculation
    SPEED: {
        SMOOTHING_FACTOR: 0.3, // Exponential moving average
        MIN_SPEED: 0.1, // km/h
        MAX_SPEED: 300, // km/h
    },

    // Export settings
    EXPORT: {
        FILENAME_PREFIX: 'track_',
        DATE_FORMAT: 'YYYY-MM-DD_HH-mm-ss',
        FILE_EXTENSION: '.json',
    },

    // Feature flags
    FEATURES: {
        ENABLE_SOUND: true,
        ENABLE_BATTERY_API: true,
        ENABLE_ANIMATIONS: true,
        ENABLE_AUTO_CENTER: true,
    }
};

// Feature detection
const FEATURES = {
    geolocation: 'geolocation' in navigator,
    battery: 'getBattery' in navigator,
    localStorage: 'localStorage' in window,
    audio: 'Audio' in window,
    vibration: 'vibrate' in navigator,
};

// Error messages
const ERROR_MESSAGES = {
    GEOLOCATION_NOT_SUPPORTED: 'Geolocation is not supported by your browser',
    PERMISSION_DENIED: 'GPS permission denied. Please enable location access',
    POSITION_UNAVAILABLE: 'GPS signal unavailable',
    TIMEOUT: 'GPS timeout - please check your connection',
    BATTERY_NOT_SUPPORTED: 'Battery API not supported',
    EXPORT_FAILED: 'Failed to export tracking data',
};

// Success messages
const SUCCESS_MESSAGES = {
    TRACKING_STARTED: 'GPS tracking started',
    TRACKING_STOPPED: 'GPS tracking stopped',
    PATH_RESET: 'Movement path reset',
    EXPORT_SUCCESS: 'Route exported successfully',
    LOCATION_UPDATED: 'Location updated',
};

// Color themes
const THEMES = {
    DARK: {
        background: '#0a0c0f',
        card: '#14181c',
        text: '#e0e0e0',
        accent: '#00ffff',
        success: '#00ff9d',
        warning: '#ffaa00',
        danger: '#ff4444',
    }
};

// Export all configurations
window.CONFIG = CONFIG;
window.FEATURES = FEATURES;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
window.THEMES = THEMES;
