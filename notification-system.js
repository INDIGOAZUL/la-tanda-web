// Mobile Push Notification UX Integration

const notificationPermission = async () => {
  if ('Notification' in window) {
    // Check if the browser supports notifications
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        subscribeToPushNotifications();
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  } else {
    console.warn('This browser does not support notifications');
  }
};

const subscribeToPushNotifications = () => {
  // Assuming Web Push or Firebase Cloud Messaging (FCM) integration is required
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.pushManager.getSubscription().then(subscription => {
        if (!subscription) {
          // Not subscribed yet, subscribe to push notifications
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY')
          }).then(newSubscription => {
            console.log('Subscribed to push notifications:', newSubscription);
            // Send new subscription to server for further processing
            sendSubscriptionToServer(newSubscription);
          }).catch(error => {
            console.error('Error during subscription:', error);
          });
        } else {
          console.log('Already subscribed to push notifications:', subscription);
        }
      }).catch(error => {
        console.error('Error checking push subscription:', error);
      });
    }).catch(error => {
      console.error('Error during service worker registration:', error);
    });
  }
};

const sendSubscriptionToServer = (subscription) => {
  // Implement the logic to send the subscription to the server
  fetch('/api/save-subscription', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }
    console.log('Subscription sent to server successfully');
  }).catch(error => {
    console.error('Error sending subscription to server:', error);
  });
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Call the notificationPermission function on page load or after user action
notificationPermission();