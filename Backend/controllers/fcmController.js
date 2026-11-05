import { getMessaging } from '../config/firebase.js';
import Notification from '../models/Notification.js';

export const sendPushNotification = async (req, res) => {
  try {
    const { token, title, body, imageUrl, data, category } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token, title, and body are required' 
      });
    }

    const messaging = getMessaging();
    if (!messaging) {
      return res.status(503).json({ 
        success: false, 
        message: 'FCM service not configured' 
      });
    }

    const message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl })
      },
      ...(data && { data }),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
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
    };

    const response = await messaging.send(message);

    const now = new Date();
    await Notification.create({
      title,
      desc: body,
      coverImage: imageUrl || '',
      category: category || '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5)
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      messageId: response 
    });
  } catch (error) {
    console.error('❌ FCM Error:', error);

    if (error.code === 'messaging/registration-token-not-registered') {
      return res.status(404).json({
        success: false,
        message: 'The FCM device token is invalid, expired or not registered.'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send notification' 
    });
  }
};

export const sendBulkNotifications = async (req, res) => {
  try {
    const { tokens, title, body, imageUrl, data, category } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tokens array is required' 
      });
    }

    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and body are required' 
      });
    }

    const messaging = getMessaging();
    if (!messaging) {
      return res.status(503).json({ 
        success: false, 
        message: 'FCM service not configured' 
      });
    }

    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl })
      },
      ...(data && { data }),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
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
    };

    const response = await messaging.sendEachForMulticast({
      tokens,
      ...message
    });

    const now = new Date();
    await Notification.create({
      title,
      desc: body,
      coverImage: imageUrl || '',
      category: category || '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5)
    });

    res.status(200).json({ 
      success: true, 
      message: `Sent ${response.successCount} of ${tokens.length} notifications`,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });
  } catch (error) {
    console.error('❌ Bulk FCM Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send notifications' 
    });
  }
};
