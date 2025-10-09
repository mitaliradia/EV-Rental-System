import express from 'express';
import { addVehicle, getAvailableVehicles } from '../controllers/vehicleController.js';
import { protectRoute, admin } from '../middleware/protectRoute.js';

const router = express.Router();

// We can chain routes for the same path
router.route('/')
    // @desc    Get all available vehicles
    // @route   GET /api/vehicles
    .get(getAvailableVehicles)
    // @desc    Add a new vehicle (Admin only)
    // @route   POST /api/vehicles
    .post(protectRoute, admin, addVehicle);

export default router;