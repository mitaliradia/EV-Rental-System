import express from 'express';
import { protectRoute, superAdmin } from '../middleware/protectRoute.js';
import { assignStationMaster, createStation, getAllStations, getAllUsers } from '../controllers/superAdminController.js';

const router = express.Router();

router.use(protectRoute, superAdmin);

router.route('/stations')
    .post(createStation)
    .get(getAllStations);

router.route('/stations/:id')
    .get(getStationDetails)
    .put(updateStation)
    .delete(deleteStation);

router.get('/users', getAllUsersAndMasters);

router.put('/users/:userId/assign-master',assignStationMaster);
router.put('/users/:userId/remove-master',removeStationMaster);

export default router;