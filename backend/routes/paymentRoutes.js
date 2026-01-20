import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { createPaymentOrder, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', protectRoute, createPaymentOrder);
router.post('/verify', protectRoute, verifyPayment);

export default router;