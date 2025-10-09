import express from 'express';
import { registerUser, loginUser, logoutUser, getMe } from '../controllers/authController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', registerUser);

// @desc    Authenticate a user and get token
// @route   POST /api/auth/login
router.post('/login', loginUser);

// @desc    Logout user and clear cookie
// @route   POST /api/auth/logout
router.post('/logout', logoutUser);

// @desc    Get the logged-in user's profile
// @route   GET /api/auth/me
router.get('/me', protectRoute, getMe);

export default router;