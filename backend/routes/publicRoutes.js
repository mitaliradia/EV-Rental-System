import express from 'express';
import Station from '../models/Station.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// GET /api/public/stations
router.get('/stations', async(req,res) => {
    const stations = await Station.find({});
    res.json(stations);
});

// GET /api/public/vehicles?stationId=...
router.get('/vehicles', async(req,res) => {
    const {stationId} = req.query;
    if(!stationId) return res.status(400).json({message: 'Station ID is required'});

    const vehicles = await Vehicle.find({ station: stationId});
    res.json(vehicles);
})

export default router;

