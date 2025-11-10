// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9PHBh208uc4lDO9F3lvBUFUotnzGd56k",
  authDomain: "appmode-a6696.firebaseapp.com",
  databaseURL: "https://appmode-a6696-default-rtdb.firebaseio.com",
  projectId: "appmode-a6696",
  storageBucket: "appmode-a6696.firebasestorage.app",
  messagingSenderId: "350506689842",
  appId: "1:350506689842:web:28faec26001e4f1331632b",
  measurementId: "G-SL94R1QEMC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Iris';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/logo_bg-removed.png',
    badge: '/logo_bg-removed.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  // Add action buttons based on notification type
  if (payload.data?.type === 'like') {
    notificationOptions.actions = [
      { action: 'view', title: 'View Post' },
      { action: 'close', title: 'Dismiss' }
    ];
  } else if (payload.data?.type === 'follow') {
    notificationOptions.actions = [
      { action: 'view', title: 'View Profile' },
      { action: 'close', title: 'Dismiss' }
    ];
  } else if (payload.data?.type === 'message') {
    notificationOptions.actions = [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' }
    ];
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  let urlToOpen = '/';

  // Determine URL based on notification type and action
  if (action === 'close') {
    return;
  }

  if (data?.type === 'like' || data?.type === 'comment') {
    urlToOpen = `/post/${data.postId}`;
  } else if (data?.type === 'follow') {
    urlToOpen = `/profile/${data.username}`;
  } else if (data?.type === 'message') {
    if (action === 'reply') {
      urlToOpen = `/messages/${data.conversationId}`;
    } else {
      urlToOpen = `/messages/${data.conversationId}`;
    }
  } else if (data?.type === 'story_reply') {
    urlToOpen = `/story-replies/${data.storyId}`;
  } else if (data?.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
