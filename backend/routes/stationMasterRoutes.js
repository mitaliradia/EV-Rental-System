import express from 'express';
import { protectRoute, stationMaster } from '../middleware/protectRoute.js';
import { addVehicle, getKycRequests, getPendingBookings, updateBookingStatus, updateKycStatus } from '../controllers/stationMasterController.js';



const router=express.Router();
router.use(protectRoute,stationMaster);

router.get('/kyc-requests',getKycRequests);
router.put('/kyc/:userId', updateKycStatus);
router.post('/vehicles', addVehicle);
router.get('/bookings/pending',getPendingBookings);
router.put('/bookings/:id',updateBookingStatus);

export default router;
