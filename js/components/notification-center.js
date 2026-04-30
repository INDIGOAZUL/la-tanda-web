// Add a timer to track user activity
let lastActivityTime = null;

function trackActivity() {
    if (lastActivityTime === null) lastActivityTime = new Date();
    else {
        const elapsedTime = new Date().getTime() - lastActivityTime.getTime();
        if (elapsedTime >= 300000) { // 5 minutes
            showPermissionPrompt();
        }
    }
}

function startTrackingUserActivity() {
    setInterval(trackActivity, 100); // Update every second
}

// Start tracking user activity on page load
document.addEventListener("DOMContentLoaded", () => {
    startTrackingUserActivity();
});