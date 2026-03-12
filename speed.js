// speed.js - Speed calculation and management

const SpeedManager = {
    currentSpeed: 0,
    maxSpeed: 0,
    avgSpeed: 0,
    speedHistory: [],
    lastPosition: null,
    lastTimestamp: null,
    smoothedSpeed: 0,

    // Calculate speed from two positions
    calculateSpeed(lat1, lon1, lat2, lon2, timestamp1, timestamp2) {
        // Calculate distance in km
        const distance = Utils.calculateDistance(lat1, lon1, lat2, lon2);
        
        // Calculate time difference in hours
        const timeDiff = (timestamp2 - timestamp1) / (1000 * 60 * 60); // Convert ms to hours
        
        if (timeDiff <= 0) return 0;
        
        // Speed in km/h
        const speed = distance / timeDiff;
        
        // Validate speed
        if (speed < CONFIG.SPEED.MIN_SPEED || speed > CONFIG.SPEED.MAX_SPEED) {
            return 0;
        }
        
        return speed;
    },

    // Update speed with new position
    updateSpeed(latitude, longitude, timestamp) {
        if (!this.lastPosition || !this.lastTimestamp) {
            // First position, can't calculate speed yet
            this.lastPosition = { latitude, longitude };
            this.lastTimestamp = timestamp;
            this.currentSpeed = 0;
            this.smoothedSpeed = 0;
            return 0;
        }

        // Calculate speed
        const speed = this.calculateSpeed(
            this.lastPosition.latitude,
            this.lastPosition.longitude,
            latitude,
            longitude,
            this.lastTimestamp,
            timestamp
        );

        // Update last position for next calculation
        this.lastPosition = { latitude, longitude };
        this.lastTimestamp = timestamp;

        // Apply smoothing
        if (speed > 0) {
            this.smoothedSpeed = this.smoothedSpeed === 0 
                ? speed 
                : (CONFIG.SPEED.SMOOTHING_FACTOR * speed) + ((1 - CONFIG.SPEED.SMOOTHING_FACTOR) * this.smoothedSpeed);
        }

        this.currentSpeed = this.smoothedSpeed;
        
        // Update max speed
        if (this.currentSpeed > this.maxSpeed) {
            this.maxSpeed = this.currentSpeed;
        }

        // Add to history
        this.addToHistory(this.currentSpeed);

        // Update average speed
        this.updateAverageSpeed();

        // Update UI
        this.updateSpeedUI();

        return this.currentSpeed;
    },

    // Add speed to history
    addToHistory(speed) {
        this.speedHistory.push({
            speed: speed,
            timestamp: Date.now()
        });

        // Keep only last 100 records
        if (this.speedHistory.length > 100) {
            this.speedHistory.shift();
        }
    },

    // Update average speed
    updateAverageSpeed() {
        if (this.speedHistory.length === 0) {
            this.avgSpeed = 0;
            return;
        }

        const sum = this.speedHistory.reduce((acc, record) => acc + record.speed, 0);
        this.avgSpeed = sum / this.speedHistory.length;
    },

    // Update speed UI
    updateSpeedUI() {
        const speedElement = document.getElementById('speedValue');
        const trendElement = document.querySelector('#speedCard .stat-trend i');
        
        if (speedElement) {
            speedElement.textContent = this.currentSpeed.toFixed(2);
        }

        // Update trend indicator
        if (trendElement && this.speedHistory.length >= 2) {
            const lastTwo = this.speedHistory.slice(-2);
            if (lastTwo[1].speed > lastTwo[0].speed) {
                trendElement.className = 'fas fa-arrow-up';
                trendElement.style.color = 'var(--accent-success)';
            } else if (lastTwo[1].speed < lastTwo[0].speed) {
                trendElement.className = 'fas fa-arrow-down';
                trendElement.style.color = 'var(--accent-danger)';
            } else {
                trendElement.className = 'fas fa-minus';
                trendElement.style.color = 'var(--text-muted)';
            }
        }
    },

    // Reset speed data
    reset() {
        this.currentSpeed = 0;
        this.maxSpeed = 0;
        this.avgSpeed = 0;
        this.speedHistory = [];
        this.lastPosition = null;
        this.lastTimestamp = null;
        this.smoothedSpeed = 0;
        this.updateSpeedUI();
    },

    // Get speed status
    getStatus() {
        return {
            current: this.currentSpeed,
            max: this.maxSpeed,
            avg: this.avgSpeed,
            history: this.speedHistory
        };
    },

    // Format speed for display
    formatSpeed(speed) {
        if (speed < 0.1) return '0.00';
        return speed.toFixed(2);
    },

    // Get speed category
    getSpeedCategory(speed) {
        if (speed < 5) return 'stationary';
        if (speed < 20) return 'walking';
        if (speed < 40) return 'running';
        if (speed < 80) return 'cycling';
        if (speed < 120) return 'driving';
        return 'fast';
    }
};

window.SpeedManager = SpeedManager;
