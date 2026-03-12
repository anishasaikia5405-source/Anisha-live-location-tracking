// utils.js - Utility functions

const Utils = {
    // Format coordinates to degrees, minutes, seconds
    formatCoordinates(lat, lon, type = 'dms') {
        if (lat === undefined || lon === undefined) return { lat: '--', lon: '--' };

        switch (type) {
            case 'dms':
                return {
                    lat: this.decimalToDMS(lat, 'lat'),
                    lon: this.decimalToDMS(lon, 'lng')
                };
            case 'decimal':
                return {
                    lat: lat.toFixed(6),
                    lon: lon.toFixed(6)
                };
            default:
                return { lat, lon };
        }
    },

    // Convert decimal degrees to DMS format
    decimalToDMS(deg, type) {
        const absolute = Math.abs(deg);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

        let direction = '';
        if (type === 'lat') {
            direction = deg >= 0 ? 'N' : 'S';
        } else {
            direction = deg >= 0 ? 'E' : 'W';
        }

        return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
    },

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Convert degrees to radians
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Format timestamp
    formatTimestamp(date = new Date()) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    },

    // Format date for export
    formatDateForExport(date = new Date()) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIconForType(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not present
        if (!document.querySelector('#notification-styles')) {
            this.addNotificationStyles();
        }
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.UI.NOTIFICATION_DURATION);
    },

    // Get icon for notification type
    getIconForType(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    },

    // Add notification styles
    addNotificationStyles() {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border: 1px solid var(--glass-border);
                border-radius: 10px;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
                box-shadow: var(--glass-shadow);
            }
            
            .notification-success {
                border-left: 4px solid var(--accent-success);
            }
            
            .notification-error {
                border-left: 4px solid var(--accent-danger);
            }
            
            .notification-warning {
                border-left: 4px solid var(--accent-warning);
            }
            
            .notification-info {
                border-left: 4px solid var(--accent-primary);
            }
            
            .notification.fade-out {
                animation: fadeOut 0.3s ease-out forwards;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    },

    // Play sound
    playSound(type = 'notification') {
        if (!FEATURES.audio || !document.querySelector('#soundAlert').checked) return;
        
        const audio = document.getElementById('notificationSound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {}); // Ignore autoplay errors
        }
    },

    // Vibrate device
    vibrate(pattern = 200) {
        if (FEATURES.vibration) {
            navigator.vibrate(pattern);
        }
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Check if value is within range
    isInRange(value, min, max) {
        return value >= min && value <= max;
    },

    // Round to decimal places
    roundTo(value, decimals = 2) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
};

window.Utils = Utils;
