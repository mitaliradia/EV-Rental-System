import express from 'express';
import { getKycRequests, updateKycStatus } from '../controllers/adminController.js';
import { getPendingBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { protectRoute, admin } from '../middleware/protectRoute.js';

const router = express.Router();

// Apply the protect and admin middleware to all routes in this file
router.use(protectRoute, admin);

// --- KYC Management ---
// @desc    Get all pending KYC requests
// @route   GET /api/admin/kyc-requests
router.get('/kyc-requests', getKycRequests);

// @desc    Update a user's KYC status
// @route   PUT /api/admin/kyc/:userId
router.put('/kyc/:userId', updateKycStatus);


// --- Booking Management ---
// @desc    Get all pending bookings
// @route   GET /api/admin/bookings/pending
router.get('/bookings/pending', getPendingBookings);

// @desc    Update a booking's status (e.g., to 'confirmed')
// @route   PUT /api/admin/bookings/:id
router.put('/bookings/:id', updateBookingStatus);


export default router;