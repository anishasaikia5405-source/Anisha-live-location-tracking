// battery.js - Battery information handling

const BatteryManager = {
    battery: null,
    listeners: [],
    
    // Initialize battery monitoring
    async init() {
        if (!FEATURES.battery) {
            console.warn(ERROR_MESSAGES.BATTERY_NOT_SUPPORTED);
            this.updateUI(null);
            return;
        }

        try {
            this.battery = await navigator.getBattery();
            this.setupListeners();
            this.updateUI(this.battery);
            
            // Update periodically
            setInterval(() => this.updateUI(this.battery), CONFIG.BATTERY.UPDATE_INTERVAL);
        } catch (error) {
            console.error('Failed to get battery info:', error);
            this.updateUI(null);
        }
    },

    // Setup battery event listeners
    setupListeners() {
        if (!this.battery) return;

        this.battery.addEventListener('levelchange', () => {
            this.updateUI(this.battery);
            this.notifyListeners('level', this.battery.level);
        });

        this.battery.addEventListener('chargingchange', () => {
            this.updateUI(this.battery);
            this.notifyListeners('charging', this.battery.charging);
        });

        this.battery.addEventListener('chargingtimechange', () => {
            this.updateUI(this.battery);
        });

        this.battery.addEventListener('dischargingtimechange', () => {
            this.updateUI(this.battery);
        });
    },

    // Update battery UI
    updateUI(battery) {
        const batteryValue = document.getElementById('batteryValue');
        const batteryStatus = document.getElementById('batteryStatus');
        const chargingIndicator = document.getElementById('chargingIndicator');
        const batteryCard = document.getElementById('batteryCard');

        if (!battery) {
            batteryValue.textContent = 'N/A';
            batteryStatus.textContent = '';
            if (chargingIndicator) chargingIndicator.style.display = 'none';
            return;
        }

        // Update battery level
        const level = Math.round(battery.level * 100);
        batteryValue.textContent = level;
        
        // Update charging status
        if (battery.charging) {
            batteryStatus.textContent = 'Charging';
            chargingIndicator.style.display = 'block';
        } else {
            batteryStatus.textContent = '%';
            chargingIndicator.style.display = 'none';
        }

        // Update battery icon and color based on level
        this.updateBatteryIcon(level, battery.charging);
        
        // Check for low battery
        if (level <= CONFIG.BATTERY.CRITICAL_THRESHOLD) {
            Utils.showNotification('Critical battery level!', 'warning');
            Utils.vibrate([500, 200, 500]);
        } else if (level <= CONFIG.BATTERY.LOW_THRESHOLD) {
            Utils.showNotification('Low battery', 'warning');
        }
    },

    // Update battery icon based on level
    updateBatteryIcon(level, isCharging) {
        const icon = document.querySelector('#batteryCard .stat-icon i');
        if (!icon) return;

        if (isCharging) {
            icon.className = 'fas fa-battery-bolt';
            icon.style.color = 'var(--accent-warning)';
        } else if (level >= 90) {
            icon.className = 'fas fa-battery-full';
            icon.style.color = 'var(--accent-success)';
        } else if (level >= 60) {
            icon.className = 'fas fa-battery-three-quarters';
            icon.style.color = 'var(--accent-success)';
        } else if (level >= 40) {
            icon.className = 'fas fa-battery-half';
            icon.style.color = 'var(--accent-warning)';
        } else if (level >= 15) {
            icon.className = 'fas fa-battery-quarter';
            icon.style.color = 'var(--accent-warning)';
        } else {
            icon.className = 'fas fa-battery-empty';
            icon.style.color = 'var(--accent-danger)';
        }
    },

    // Get current battery level
    getLevel() {
        if (!this.battery) return null;
        return Math.round(this.battery.level * 100);
    },

    // Check if device is charging
    isCharging() {
        if (!this.battery) return null;
        return this.battery.charging;
    },

    // Add listener for battery changes
    addListener(callback) {
        this.listeners.push(callback);
    },

    // Notify all listeners
    notifyListeners(type, value) {
        this.listeners.forEach(callback => {
            try {
                callback(type, value, this.battery);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });
    },

    // Get battery status summary
    getStatus() {
        if (!this.battery) return 'Battery info unavailable';
        
        const level = Math.round(this.battery.level * 100);
        const charging = this.battery.charging ? 'Charging' : 'Not charging';
        return `${level}% - ${charging}`;
    }
};

window.BatteryManager = BatteryManager;
