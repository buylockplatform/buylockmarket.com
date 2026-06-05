import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin with credentials from environment variables
const apps = getApps();
if (!apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Push notifications will not work.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface MulticastResult {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
  responses: any[];
}

export const sendPushNotification = async (token: string, payload: NotificationPayload): Promise<boolean> => {
  const currentApps = getApps();
  if (!currentApps.length) {
    console.warn('Firebase Admin is not initialized. Skipping push notification.');
    return false;
  }
  try {
    const response = await getMessaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

export const sendMulticastPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<MulticastResult> => {
  const currentApps = getApps();
  if (!currentApps.length || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [], responses: [] };
  }

  const CHUNK_SIZE = 500;
  let successCount = 0;
  let failureCount = 0;
  const failedTokens: string[] = [];
  const responses: any[] = [];

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);
    try {
      const result = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      });

      successCount += result.successCount;
      failureCount += result.failureCount;
      responses.push(...result.responses);

      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            failedTokens.push(chunk[idx]);
          }
        }
      });
    } catch (error) {
      console.error('Error sending multicast chunk:', error);
      failureCount += chunk.length;
    }
  }

  return { successCount, failureCount, failedTokens, responses };
};
