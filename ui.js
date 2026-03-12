// ui.js - UI management and interactions

const UIManager = {
    elements: {},
    
    // Initialize UI
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupLoadingAnimations();
        this.detectDevice();
        this.updateDeviceInfo();
        this.startUIUpdates();
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            startBtn: document.getElementById('startTrackingBtn'),
            stopBtn: document.getElementById('stopTrackingBtn'),
            resetBtn: document.getElementById('resetPathBtn'),
            exportBtn: document.getElementById('exportBtn'),
            soundToggle: document.getElementById('soundAlert'),
            deviceType: document.getElementById('deviceType'),
            platform: document.getElementById('platform')
        };
    },

    // Setup event listeners
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => {
            MapManager.startTracking();
            this.toggleButtons(true);
        });

        this.elements.stopBtn.addEventListener('click', () => {
            MapManager.stopTracking();
            this.toggleButtons(false);
        });

        this.elements.resetBtn.addEventListener('click', () => {
            MapManager.resetPath();
        });

        this.elements.exportBtn.addEventListener('click', () => {
            MapManager.exportRoute();
        });

        // Listen for location updates
        window.addEventListener('locationUpdate', (event) => {
            this.updateUIWithLocation(event.detail);
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            Utils.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.showNotification('Connection lost', 'warning');
        });
    },

    // Toggle button states
    toggleButtons(isTracking) {
        this.elements.startBtn.disabled = isTracking;
        this.elements.stopBtn.disabled = !isTracking;
        
        if (isTracking) {
            this.elements.startBtn.classList.remove('primary');
            this.elements.stopBtn.classList.add('secondary');
        } else {
            this.elements.startBtn.classList.add('primary');
            this.elements.stopBtn.classList.remove('secondary');
        }
    },

    // Setup loading animations
    setupLoadingAnimations() {
        // Add loading class to cards initially
        const cards = document.querySelectorAll('.stat-card, .coordinates-card, .device-card');
        cards.forEach(card => card.classList.add('loading'));

        // Remove loading after content loads
        setTimeout(() => {
            cards.forEach(card => card.classList.remove('loading'));
        }, 1500);
    },

    // Detect device type
    detectDevice() {
        const ua = navigator.userAgent;
        let deviceType = 'Desktop';
        let platform = navigator.platform;

        if (/mobile/i.test(ua)) {
            deviceType = 'Mobile';
        } else if (/tablet/i.test(ua)) {
            deviceType = 'Tablet';
        }

        // More specific detection
        if (/iPhone|iPad|iPod/i.test(ua)) {
            deviceType = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
            platform = 'iOS';
        } else if (/Android/i.test(ua)) {
            deviceType = /Mobile/i.test(ua) ? 'Android Phone' : 'Android Tablet';
            platform = 'Android';
        } else if (/Windows/i.test(ua)) {
            platform = 'Windows';
        } else if (/Mac/i.test(ua)) {
            platform = 'macOS';
        } else if (/Linux/i.test(ua)) {
            platform = 'Linux';
        }

        this.elements.deviceType.textContent = deviceType;
        this.elements.platform.textContent = platform;

        // Update icon based on device
        this.updateDeviceIcon(deviceType);
    },

    // Update device icon
    updateDeviceIcon(deviceType) {
        const icon = document.querySelector('#deviceCard .info-item:first-child i');
        if (!icon) return;

        if (deviceType.includes('iPhone') || deviceType.includes('iPad')) {
            icon.className = 'fab fa-apple';
        } else if (deviceType.includes('Android')) {
            icon.className = 'fab fa-android';
        } else if (deviceType.includes('Mobile')) {
            icon.className = 'fas fa-mobile-alt';
        } else if (deviceType.includes('Tablet')) {
            icon.className = 'fas fa-tablet-alt';
        } else {
            icon.className = 'fas fa-laptop';
        }
    },

    // Update device info periodically
    updateDeviceInfo() {
        // Update platform info
        setInterval(() => {
            const platform = document.getElementById('platform');
            if (platform) {
                platform.textContent = navigator.platform;
            }
        }, 5000);
    },

    // Update UI with location data
    updateUIWithLocation(data) {
        // Update timestamp
        const now = new Date();
        document.getElementById('lastUpdate').textContent = 
            `Updated ${Utils.formatTimestamp(now)}`;

        // Update any other real-time UI elements
    },

    // Handle page visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, reduce update frequency
            console.log('App in background');
        } else {
            // Page is visible again, refresh data
            console.log('App in foreground');
            if (MapManager.isTrackingActive()) {
                Utils.showNotification('Tracking resumed', 'info');
            }
        }
    },

    // Start periodic UI updates
    startUIUpdates() {
        // Update timestamp every second
        setInterval(() => {
            if (MapManager.isTrackingActive()) {
                document.getElementById('timestamp').textContent = Utils.formatTimestamp();
            }
        }, 1000);

        // Update battery info periodically
        setInterval(() => {
            BatteryManager.updateUI(BatteryManager.battery);
        }, CONFIG.BATTERY.UPDATE_INTERVAL);
    },

    // Show/hide loading state
    setLoading(isLoading, element) {
        if (element) {
            if (isLoading) {
                element.classList.add('loading');
            } else {
                element.classList.remove('loading');
            }
        }
    },

    // Update theme
    setTheme(theme) {
        const root = document.documentElement;
        const colors = THEMES[theme.toUpperCase()] || THEMES.DARK;
        
        Object.keys(colors).forEach(key => {
            root.style.setProperty(`--${key}`, colors[key]);
        });
    },

    // Show modal dialog
    showModal(title, message, buttons = []) {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => 
                        `<button class="btn ${btn.class || ''}" data-action="${btn.action}">${btn.text}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        // Add modal styles if not present
        if (!document.querySelector('#modal-styles')) {
            this.addModalStyles();
        }

        document.body.appendChild(modal);

        // Setup event listeners
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => modal.remove());

        buttons.forEach(btn => {
            const btnElement = modal.querySelector(`[data-action="${btn.action}"]`);
            if (btnElement && btn.callback) {
                btnElement.addEventListener('click', () => {
                    btn.callback();
                    modal.remove();
                });
            }
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    },

    // Add modal styles
    addModalStyles() {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-content {
                max-width: 500px;
                width: 90%;
                padding: 0;
                animation: slideUp 0.3s ease-out;
            }
            
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--glass-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                color: var(--accent-primary);
            }
            
            .close-modal {
                background: none;
                border: none;
                color: var(--text-primary);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .close-modal:hover {
                color: var(--accent-danger);
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .modal-footer {
                padding: 20px;
                border-top: 1px solid var(--glass-border);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

window.UIManager = UIManager;
