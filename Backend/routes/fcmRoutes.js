import express from 'express';
import { sendPushNotification, sendBulkNotifications } from '../controllers/fcmController.js';

const router = express.Router();

router.post('/send', sendPushNotification);
router.post('/send-bulk', sendBulkNotifications);

export default router;
