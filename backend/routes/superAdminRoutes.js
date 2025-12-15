import express from 'express';
import { protectRoute, superAdmin } from '../middleware/protectRoute.js';
import { createStation, getAllStations, assignStationMaster, getAllUsersAndMasters, getAssignmentData, removeStationMaster, getStationDetails } from '../controllers/superAdminController.js';

const router = express.Router();
router.use(protectRoute, superAdmin);

router.post('/stations', createStation);
router.get('/stations', getAllStations);
router.get('/stations/:id',getStationDetails);
router.get('/users', getAllUsersAndMasters);
router.put('/users/:userId/assign', assignStationMaster);
router.get('/assignment-data', getAssignmentData);
router.put('/users/:userId/remove-master', removeStationMaster);

export default router;