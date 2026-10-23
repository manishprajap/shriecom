import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';



export const useFCM = () => {
  

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initMobilePush();
    } else {
      initWebPush();
    }
  }, []);

  // ✅ Mobile: Android / iOS
  const initMobilePush = async () => {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      saveTokenToBackend(token.value, 'mobile');
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Foreground notification:', notification);
      // Yahan Toast ya Alert show karo
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Notification tap:', action);
      // Yahan page redirect karo
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('FCM Registration error:', err);
    });
  };

  // ✅ Web Browser
  const initWebPush = async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      const firebaseApp = initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      });

      const messaging = getMessaging(firebaseApp);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        saveTokenToBackend(token, 'web');
      }

      // Foreground message
      onMessage(messaging, (payload) => {
        console.log('Web foreground message:', payload);
        // Yahan custom notification show karo
      });

    } catch (error) {
      console.error('Web push error:', error);
    }
  };

  // ✅ Laravel backend mein token save karo
 const saveTokenToBackend = async (token: string, platform: string) => {
  try {
    const authToken = localStorage.getItem('auth_token');
	
  // ✅ Correct log
    console.log('Auth Token:', authToken);
	
    if (!authToken) {
      console.warn('User not logged in, skipping FCM token save');
      return;
    }

    const response = await fetch('https://shriecom.in/appapis/shreefood/public/api/save-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcm_token: token, platform }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log('FCM token saved');
  } catch (error) {
    console.error('Token save error:', error);
  }
};
};