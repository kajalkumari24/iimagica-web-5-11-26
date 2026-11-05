import Notification from "../models/Notification.js";
import { getMessaging } from '../config/firebase.js';
import Profile from "../models/Profile.js";
import User from "../models/User.js";

const normalizeTargetProfileType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "all") return "global";
  return normalized;
};

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a notification with image
export const createNotification = async (req, res) => {
  try {
    const { title, desc, date, time, category, targetProfileType, sendPush, token } = req.body;
    const coverImage = req.file?.path || ""; // multer-cloudinary stores file.path as URL

    const newNotification = new Notification({
      title,
      desc,
      date,
      time,
      category,
      targetProfileType: normalizeTargetProfileType(targetProfileType),
      coverImage
    });

    const saved = await newNotification.save();
    
    // 🟢 Emit socket event for real-time update
    if (global.io) {
      global.io.emit('notificationUpdated', saved);
    }

    // 🚀 FIREBASE PUSH NOTIFICATION LOGIC
    if (sendPush === 'true') {
      const messaging = getMessaging();
      if (messaging) {
        try {
          let fcmTokens = [];

          if (token && token.trim() !== '') {
            // Testing on specific device
            fcmTokens.push(token);
          } else {
            const normalizedType = normalizeTargetProfileType(targetProfileType);
            
            if (normalizedType === 'global' || normalizedType === 'all') {
              // Global: Fetch directly from all Users who have an FCM token
              const allUsers = await User.find({ fcmToken: { $exists: true, $ne: "" } });
              allUsers.forEach((u) => {
                if (u.fcmToken && typeof u.fcmToken === 'string' && u.fcmToken.trim() !== '') {
                  fcmTokens.push(u.fcmToken.trim());
                }
              });
            } else {
              // Specific Profile Type: Find any matching profile regardless of isActive status
              let query = {};
              query.$or = [{ profiletype: normalizedType }, { profileType: normalizedType }];
              
              if (category && category.trim() !== '') {
                const categoryQuery = { $or: [] };
                if (normalizedType === 'political') {
                  categoryQuery.$or.push({ partyname: category }, { 'political.partyname': category });
                } else if (normalizedType === 'professional') {
                  categoryQuery.$or.push({ categories: category }, { 'professional.categories': category });
                } else if (normalizedType === 'brand') {
                  categoryQuery.$or.push({ brandName: category }, { 'brand.brandName': category });
                } else {
                  categoryQuery.$or.push({ category: category });
                }
                if (categoryQuery.$or.length > 0) {
                  query = { $and: [query, categoryQuery] };
                }
              }

              // Find matching profiles and extract their tokens
              const profiles = await Profile.find(query).populate('userId', 'fcmToken');
              profiles.forEach((profile) => {
                const userToken = profile.userId?.fcmToken || profile.fcmToken;
                if (userToken && typeof userToken === 'string' && userToken.trim() !== '') {
                  fcmTokens.push(userToken.trim());
                }
              });
            }

            // Remove duplicate tokens
            fcmTokens = [...new Set(fcmTokens)];
            // console.log('[notifications] target=', normalizedType, 'category=', category || '', 'matchedTokens=', fcmTokens.length);
          }

          if (fcmTokens.length > 0) {
            const messagePayload = {
              notification: {
                title: title,
                body: desc,
              },
              android: {
                priority: 'high',
                notification: { sound: 'default', channelId: 'default' }
              }
            };
            if (coverImage) messagePayload.notification.imageUrl = coverImage;

            // Send in batches of 500 (Firebase FCM limit)
            const batchSize = 500;
            for (let i = 0; i < fcmTokens.length; i += batchSize) {
              const tokensBatch = fcmTokens.slice(i, i + batchSize);
              const response = await messaging.sendEachForMulticast({
                tokens: tokensBatch,
                ...messagePayload
              });
              // console.log(`Batch ${i / batchSize + 1}: Sent ${response.successCount} messages, ${response.failureCount} failed.`);
              
              // Log exact reason for failure
              if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    console.error(`❌ Failed Token [${tokensBatch[idx]}]: ${resp.error?.message}`);
                  }
                });
              }
            }
          } else {
            // console.log('No FCM tokens found for the selected Target/Category.');
          }
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a notification (supports optional new coverImage upload)
export const updateNotification = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, desc, date, time, category, targetProfileType } = req.body;
    const coverImage = req.file?.path; // if a new file uploaded, multer-cloudinary stores URL in path

    const update = {
      title,
      desc,
      date,
      time,
      category,
      targetProfileType: normalizeTargetProfileType(targetProfileType),
    };
    if (coverImage) update.coverImage = coverImage;

    const updated = await Notification.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    
    // 🟢 Emit socket event for real-time update
    if (global.io) {
      global.io.emit('notificationUpdated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
