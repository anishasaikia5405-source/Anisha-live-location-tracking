// map.js - Map management with Leaflet

const MapManager = {
    map: null,
    marker: null,
    path: null,
    pathPoints: [],
    userLocation: null,
    watchId: null,
    isTracking: false,
    
    // Initialize map
    init() {
        // Create map instance
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: true,
            fadeAnimation: true,
            zoomAnimation: true,
            markerZoomAnimation: true
        });

        // Add tile layer
        L.tileLayer(CONFIG.MAP.TILE_LAYER, {
            attribution: CONFIG.MAP.ATTRIBUTION,
            maxZoom: CONFIG.MAP.MAX_ZOOM,
            minZoom: CONFIG.MAP.MIN_ZOOM
        }).addTo(this.map);

        // Set default view (world view)
        this.map.setView([0, 0], CONFIG.MAP.MIN_ZOOM);

        // Initialize path polyline
        this.path = L.polyline([], {
            color: CONFIG.MAP.PATH_COLOR,
            weight: CONFIG.MAP.PATH_WEIGHT,
            opacity: CONFIG.MAP.PATH_OPACITY,
            lineJoin: 'round'
        }).addTo(this.map);

        // Setup map controls
        this.setupControls();

        // Request location permission immediately
        this.requestLocationPermission();

        return this.map;
    },

    // Setup custom controls
    setupControls() {
        // Connect UI buttons
        document.getElementById('centerMapBtn').addEventListener('click', () => this.centerOnUser());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.map.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.map.zoomOut());
    },

    // Request location permission
    requestLocationPermission() {
        if (!FEATURES.geolocation) {
            Utils.showNotification(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED, 'error');
            return;
        }

        // This will trigger the browser's permission request
        navigator.geolocation.getCurrentPosition(
            (position) => {
                Utils.showNotification('GPS access granted', 'success');
                this.updateGPSStatus(true);
            },
            (error) => {
                this.handleGeoError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    },

    // Start tracking
    startTracking() {
        if (!FEATURES.geolocation) {
            Utils.showNotification(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED, 'error');
            return false;
        }

        if (this.isTracking) {
            return true;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handleGeoError(error),
            {
                enableHighAccuracy: CONFIG.GPS.ENABLE_HIGH_ACCURACY,
                timeout: CONFIG.GPS.TIMEOUT,
                maximumAge: CONFIG.GPS.MAXIMUM_AGE
            }
        );

        this.isTracking = true;
        this.updateTrackingStatus(true);
        
        // Play sound and show notification
        Utils.playSound('tracking_start');
        Utils.showNotification(SUCCESS_MESSAGES.TRACKING_STARTED, 'success');
        Utils.vibrate(200);

        return true;
    },

    // Stop tracking
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.isTracking = false;
        this.updateTrackingStatus(false);
        
        Utils.playSound('tracking_stop');
        Utils.showNotification(SUCCESS_MESSAGES.TRACKING_STOPPED, 'info');
        
        return true;
    },

    // Handle position updates
    handlePositionUpdate(position) {
        const { latitude, longitude, accuracy, speed, heading, timestamp } = position.coords;
        
        // Check accuracy
        if (accuracy > CONFIG.GPS.MIN_ACCURACY) {
            console.warn('Low accuracy:', accuracy);
        }

        // Update user location
        this.userLocation = { latitude, longitude, accuracy, timestamp: position.timestamp };

        // Update marker
        this.updateMarker(latitude, longitude);

        // Update path
        this.addPathPoint(latitude, longitude, position.timestamp);

        // Auto center if enabled
        if (CONFIG.FEATURES.ENABLE_AUTO_CENTER) {
            this.centerOnUser();
        }

        // Update coordinates display
        this.updateCoordinatesDisplay(latitude, longitude);

        // Update accuracy display
        this.updateAccuracyDisplay(accuracy);

        // Update speed
        const speedKmh = speed ? speed * 3.6 : 0; // Convert m/s to km/h if available
        SpeedManager.updateSpeed(latitude, longitude, position.timestamp);

        // Update timestamp
        this.updateTimestamp();

        // Dispatch event for other modules
        this.dispatchLocationEvent(position);
    },

    // Update marker position
    updateMarker(latitude, longitude) {
        if (!this.marker) {
            // Create custom marker icon
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 20px;
                    height: 20px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    box-shadow: 0 0 20px var(--accent-primary);
                    border: 2px solid white;
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            this.marker = L.marker([latitude, longitude], { icon }).addTo(this.map);
        } else {
            this.marker.setLatLng([latitude, longitude]);
        }
    },

    // Add point to path
    addPathPoint(latitude, longitude, timestamp) {
        const point = [latitude, longitude];
        
        // Add to path points array
        this.pathPoints.push({
            lat: latitude,
            lng: longitude,
            timestamp: timestamp
        });

        // Limit history size
        if (this.pathPoints.length > CONFIG.MAP.MAX_HISTORY_POINTS) {
            this.pathPoints.shift();
        }

        // Update polyline
        const latLngs = this.pathPoints.map(p => [p.lat, p.lng]);
        this.path.setLatLngs(latLngs);

        // Update distance
        this.updateTotalDistance();
        
        // Update history count in UI
        document.getElementById('historyCount').textContent = 
            `${this.pathPoints.length} points`;
    },

    // Center map on user location
    centerOnUser() {
        if (this.userLocation) {
            this.map.setView(
                [this.userLocation.latitude, this.userLocation.longitude],
                CONFIG.MAP.DEFAULT_ZOOM
            );
        }
    },

    // Update coordinates display
    updateCoordinatesDisplay(latitude, longitude) {
        const formatted = Utils.formatCoordinates(latitude, longitude, 'dms');
        document.getElementById('latitude').textContent = formatted.lat;
        document.getElementById('longitude').textContent = formatted.lon;
    },

    // Update accuracy display
    updateAccuracyDisplay(accuracy) {
        const accuracyElement = document.getElementById('accuracyValue');
        accuracyElement.textContent = accuracy.toFixed(1);
        
        // Update accuracy indicator color
        const dot = document.querySelector('.accuracy-dot');
        if (dot) {
            if (accuracy <= 10) {
                dot.style.background = 'var(--accent-success)';
            } else if (accuracy <= 50) {
                dot.style.background = 'var(--accent-warning)';
            } else {
                dot.style.background = 'var(--accent-danger)';
            }
        }
    },

    // Update timestamp display
    updateTimestamp() {
        document.getElementById('timestamp').textContent = Utils.formatTimestamp();
        document.getElementById('lastUpdate').textContent = 
            `Updated ${Utils.formatTimestamp()}`;
    },

    // Update total distance
    updateTotalDistance() {
        if (this.pathPoints.length < 2) {
            document.getElementById('distanceValue').textContent = '0.00';
            return;
        }

        let totalDistance = 0;
        for (let i = 1; i < this.pathPoints.length; i++) {
            const p1 = this.pathPoints[i - 1];
            const p2 = this.pathPoints[i];
            totalDistance += Utils.calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        }

        document.getElementById('distanceValue').textContent = totalDistance.toFixed(2);
    },

    // Reset path
    resetPath() {
        this.pathPoints = [];
        this.path.setLatLngs([]);
        this.updateTotalDistance();
        SpeedManager.reset();
        document.getElementById('historyCount').textContent = '0 points';
        Utils.showNotification(SUCCESS_MESSAGES.PATH_RESET, 'info');
    },

    // Export route as JSON
    exportRoute() {
        if (this.pathPoints.length === 0) {
            Utils.showNotification('No path data to export', 'warning');
            return;
        }

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalPoints: this.pathPoints.length,
                totalDistance: parseFloat(document.getElementById('distanceValue').textContent),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                }
            },
            path: this.pathPoints,
            stats: SpeedManager.getStatus()
        };

        const fileName = `${CONFIG.EXPORT.FILENAME_PREFIX}${Utils.formatDateForExport()}${CONFIG.EXPORT.FILE_EXTENSION}`;
        const jsonStr = JSON.stringify(exportData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        
        Utils.showNotification(SUCCESS_MESSAGES.EXPORT_SUCCESS, 'success');
        Utils.playSound('export');
    },

    // Handle geolocation errors
    handleGeoError(error) {
        let message = ERROR_MESSAGES.POSITION_UNAVAILABLE;
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = ERROR_MESSAGES.PERMISSION_DENIED;
                break;
            case error.POSITION_UNAVAILABLE:
                message = ERROR_MESSAGES.POSITION_UNAVAILABLE;
                break;
            case error.TIMEOUT:
                message = ERROR_MESSAGES.TIMEOUT;
                break;
        }
        
        Utils.showNotification(message, 'error');
        console.error('Geolocation error:', error);
        
        this.updateGPSStatus(false);
    },

    // Update GPS status indicator
    updateGPSStatus(active) {
        const gpsStatus = document.getElementById('gpsStatus');
        const icon = gpsStatus.querySelector('i');
        const text = gpsStatus.querySelector('.status-text');
        
        if (active) {
            icon.style.color = 'var(--accent-success)';
            text.textContent = 'GPS Active';
            text.style.color = 'var(--accent-success)';
        } else {
            icon.style.color = 'var(--text-muted)';
            text.textContent = 'GPS Inactive';
            text.style.color = 'var(--text-muted)';
        }
    },

    // Update tracking status indicator
    updateTrackingStatus(active) {
        const trackingStatus = document.getElementById('trackingStatus');
        const icon = trackingStatus.querySelector('i');
        const text = trackingStatus.querySelector('.status-text');
        
        if (active) {
            icon.style.color = 'var(--accent-primary)';
            text.textContent = 'Tracking On';
            text.style.color = 'var(--accent-primary)';
            icon.classList.add('fa-beat');
        } else {
            icon.style.color = 'var(--text-muted)';
            text.textContent = 'Tracking Off';
            text.style.color = 'var(--text-muted)';
            icon.classList.remove('fa-beat');
        }
    },

    // Dispatch location event for other modules
    dispatchLocationEvent(position) {
        const event = new CustomEvent('locationUpdate', { 
            detail: { 
                position: position,
                pathPoints: this.pathPoints,
                userLocation: this.userLocation
            } 
        });
        window.dispatchEvent(event);
    },

    // Get current location
    getCurrentLocation() {
        return this.userLocation;
    },

    // Get path points
    getPathPoints() {
        return this.pathPoints;
    },

    // Check if tracking is active
    isTrackingActive() {
        return this.isTracking;
    }
};

window.MapManager = MapManager;
