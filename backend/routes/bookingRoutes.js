import express from 'express';
import { createBooking, getMyBookings } from '../controllers/bookingController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// @desc    Create a new booking
// @route   POST /api/bookings
router.post('/', protectRoute, createBooking);

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/mybookings
router.get('/mybookings', protectRoute, getMyBookings);

export default router;