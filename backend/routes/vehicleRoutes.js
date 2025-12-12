import express from 'express';
import { getAvailableVehicles } from '../controllers/vehicleController.js';
const router = express.Router();
router.get('/', getAvailableVehicles);
export default router;