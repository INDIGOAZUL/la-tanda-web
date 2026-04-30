// js/hub/notification-center.js

import { pushNotification } from './notification-infrastructure';

const userActivityMap = {};
let permissionBannerShown = false;

function trackUserActivity() {
  document.addEventListener('click', () => {
    trackEvent('click');
  });

  document.addEventListener('scroll', () => {
    trackEvent('scroll');
  });
}

function trackEvent(event) {
  const timestamp = Date.now();
  userActivityMap[timestamp] = event;
  if (Object.keys(userActivityMap).length > 300) {
    checkPermission();
  }
}

async function checkPermission() {
  if (!permissionBannerShown && !userActivityMap[Date.now() - 18000]) {
    const permission = await askForPushPermission();
    if (permission) {
      registerForPush();
    } else {
      // Set a timer to show the banner again in 7 days
      setTimeout(() => {
        showPermissionBanner();
      }, 604800000);
    }
  }
}

async function askForPushPermission() {
  return new Promise((resolve, reject) => {
    chrome.permissions.request({
      permissions: ['notifications'],
    }, (granted) => {
      if (granted) {
        resolve(true);
      } else {
        reject(false);
      }
    });
  });
}

function registerForPush() {
  pushNotification.register();
}

function showPermissionBanner() {
  permissionBannerShown = true;
  const bannerHTML = `
    <div class="notification-banner">
      <p>Para recibir notificaciones, permíteme que solicite permiso.</p>
      <button onclick="acceptPermission()">Aceptar</button>
      <button onclick="denyPermission()">Deny</button>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', bannerHTML);
}

function acceptPermission() {
  chrome.permissions.request({
    permissions: ['notifications'],
  }, (granted) => {
    if (granted) {
      registerForPush();
    }
  });
}

function denyPermission() {
  permissionBannerShown = true;
  chrome.notifications.clear('notification-ban');
}