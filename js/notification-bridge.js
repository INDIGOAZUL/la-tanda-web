// ============================================
// LA TANDA - NOTIFICATION BRIDGE
// Routes all notifications through LaTandaPopup
// Version: 1.0.0
// ============================================

(function() {
    "use strict";

    // Wait for popup manager to be available
    function waitForPopup(callback) {
        if (window.LaTandaPopup) {
            callback();
        } else {
            setTimeout(function() { waitForPopup(callback); }, 100);
        }
    }

    waitForPopup(function() {

        // ============================================
        // OVERRIDE showNotification
        // ============================================
        var originalShowNotification = window.showNotification;
        window.showNotification = function(message, type) {
            type = type || "info";

            switch (type) {
                case "error":
                    window.LaTandaPopup.showError(message);
                    break;
                case "success":
                    window.LaTandaPopup.showSuccess(message);
                    break;
                case "warning":
                    window.LaTandaPopup.showWarning(message);
                    break;
                default:
                    window.LaTandaPopup.showInfo(message);
            }
        };

        // ============================================
        // CREATE showError GLOBAL
        // ============================================
        window.showError = function(message, details, retryFn) {
            window.LaTandaPopup.showError(message, details, retryFn);
        };

        // ============================================
        // CREATE showSuccess GLOBAL
        // ============================================
        window.showSuccess = function(message, duration) {
            window.LaTandaPopup.showSuccess(message, duration);
        };

        // ============================================
        // CREATE showWarning GLOBAL
        // ============================================
        window.showWarning = function(message, actions) {
            window.LaTandaPopup.showWarning(message, actions);
        };

        // ============================================
        // CREATE showInfo GLOBAL
        // ============================================
        window.showInfo = function(message) {
            window.LaTandaPopup.showInfo(message);
        };

        // ============================================
        // CREATE showConfirm GLOBAL
        // ============================================
        window.showConfirm = function(message, onConfirm, onCancel) {
            window.LaTandaPopup.showConfirm(message, onConfirm, onCancel);
        };

        // ============================================
        // CREATE showLoading/hideLoading GLOBAL
        // ============================================
        window.showLoading = function(message) {
            window.LaTandaPopup.showLoading(message);
        };

        window.hideLoading = function() {
            window.LaTandaPopup.hideLoading();
        };

        // ============================================
        // OVERRIDE LaTandaComponents.showNotification IF EXISTS
        // ============================================
        if (window.LaTandaComponents) {
            window.LaTandaComponents.showNotification = function(type, message) {
                window.showNotification(message, type);
            };
        }

        // ============================================
        // OVERRIDE laTandaComponents.showNotification IF EXISTS
        // ============================================
        if (window.laTandaComponents) {
            window.laTandaComponents.showNotification = function(type, message) {
                window.showNotification(message, type);
            };
        }

    });
})();
