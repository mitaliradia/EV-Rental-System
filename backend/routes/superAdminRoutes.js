import express from 'express';
import { protectRoute, superAdmin } from '../middleware/protectRoute.js';
import { createStation, assignStationMaster, getAllUsersAndMasters, getAssignmentData, removeStationMaster, getStationOverview, getStationDetails, updateStation, removeVehicleFromStation } from '../controllers/superAdminController.js';
import { addVehicle } from '../controllers/vehicleController.js';

const router = express.Router();
router.use(protectRoute, superAdmin);

router.post('/stations', createStation);
router.get('/stations/overview', getStationOverview);
router.get('/stations/:id',getStationDetails);
router.put('/stations/:id',updateStation);
router.get('/users', getAllUsersAndMasters);
router.put('/users/:userId/assign', assignStationMaster);
router.get('/assignment-data', getAssignmentData);
router.put('/users/:userId/remove-master', removeStationMaster);
router.post('/vehicles',addVehicle);
router.delete('/vehicles/:vehicleId',removeVehicleFromStation);

export default router;