import express from 'express';
import { sendOTP, verifyOTP, checkVerificationStatus } from '../controllers/otpController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/send', protectRoute, sendOTP);
router.post('/verify', protectRoute, verifyOTP);
router.get('/status', protectRoute, checkVerificationStatus);

export default router;