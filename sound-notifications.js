/* ============================================
   🔔 SOUND NOTIFICATIONS
   ============================================ */

const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp6Xj4d1bWRgX2BjZ2twd3+Bg4aIiIeGhoaGh4mKiYuNjY2NjY6QkJCPj4+Pj5CRkZGRkZGRkpKSkpKSkpMTExMTExMTFBMUFBQUFBQUFRQUFBQUFBQU');

function playNotification() {
    if (localStorage.getItem('soundEnabled') !== 'false') {
        notificationSound.volume = 0.3;
        notificationSound.play().catch(() => {});
    }
}

// Hook into existing notification system
const originalShow = window.showNotification;
window.showNotification = function(...args) {
    playNotification();
    return originalShow?.apply(this, args);
};
