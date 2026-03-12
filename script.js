// script.js - Main application entry point

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Live Location Tracker initializing...');
    
    try {
        // Initialize all modules
        await initializeApp();
        
        // Show welcome message
        showWelcomeMessage();
        
        console.log('Live Location Tracker initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        Utils.showNotification('Failed to initialize application', 'error');
    }
});

// Initialize all application modules
async function initializeApp() {
    // Check for required features
    checkFeatureSupport();

    // Initialize map first (this requests permission)
    MapManager.init();

    // Initialize UI
    UIManager.init();

    // Initialize battery monitoring
    await BatteryManager.init();

    // Set up additional event listeners
    setupGlobalEventListeners();

    // Check for saved preferences
    loadSavedPreferences();
}

// Check for feature support
function checkFeatureSupport() {
    console.log('Feature support check:');
    console.log('- Geolocation:', FEATURES.geolocation);
    console.log('- Battery API:', FEATURES.battery);
    console.log('- Local Storage:', FEATURES.localStorage);
    console.log('- Audio:', FEATURES.audio);
    console.log('- Vibration:', FEATURES.vibration);

    if (!FEATURES.geolocation) {
        Utils.showNotification(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED, 'error');
    }
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Handle before unload
    window.addEventListener('beforeunload', (e) => {
        if (MapManager.isTrackingActive()) {
            // Confirm before closing if tracking is active
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Handle errors
    window.addEventListener('error', (e) => {
        console.error('Global error:', e.error);
        Utils.showNotification('An error occurred', 'error');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        Utils.showNotification('An error occurred', 'error');
    });
}

// Show welcome message
function showWelcomeMessage() {
    setTimeout(() => {
        Utils.showNotification('Live Location Tracker ready', 'success');
    }, 1000);
}

// Load saved preferences from localStorage
function loadSavedPreferences() {
    if (!FEATURES.localStorage) return;

    try {
        // Load sound preference
        const soundEnabled = localStorage.getItem('soundEnabled');
        if (soundEnabled !== null) {
            document.getElementById('soundAlert').checked = soundEnabled === 'true';
        }

        // Load last known position if available
        const lastPosition = localStorage.getItem('lastPosition');
        if (lastPosition) {
            const pos = JSON.parse(lastPosition);
            console.log('Last known position:', pos);
        }
    } catch (error) {
        console.error('Failed to load preferences:', error);
    }
}

// Save preferences to localStorage
function savePreferences() {
    if (!FEATURES.localStorage) return;

    try {
        localStorage.setItem('soundEnabled', document.getElementById('soundAlert').checked);
        
        // Save last position if available
        const currentLocation = MapManager.getCurrentLocation();
        if (currentLocation) {
            localStorage.setItem('lastPosition', JSON.stringify(currentLocation));
        }
    } catch (error) {
        console.error('Failed to save preferences:', error);
    }
}

// Handle app shutdown
function shutdownApp() {
    console.log('Shutting down application...');
    
    // Stop tracking if active
    if (MapManager.isTrackingActive()) {
        MapManager.stopTracking();
    }

    // Save preferences
    savePreferences();

    console.log('Application shutdown complete');
}

// Register shutdown handler
window.addEventListener('unload', shutdownApp);

// Export app for debugging
window.app = {
    map: MapManager,
    ui: UIManager,
    battery: BatteryManager,
    speed: SpeedManager,
    utils: Utils,
    config: CONFIG
};
