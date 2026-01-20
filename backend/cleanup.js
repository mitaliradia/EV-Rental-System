import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Station from './models/Station.js';

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all stations without masters
        const allStations = await Station.find({}).select('_id name');
        const managedStationIds = await User.distinct('station', { role: 'station-master' });
        
        const unmanagedStations = allStations.filter(station => 
            !managedStationIds.some(id => id && id.toString() === station._id.toString())
        );

        console.log(`Found ${unmanagedStations.length} unmanaged stations:`);
        unmanagedStations.forEach(s => console.log(`- ${s.name} (${s._id})`));

        // Remove vehicles from unmanaged stations
        const result = await Vehicle.deleteMany({ 
            station: { $in: unmanagedStations.map(s => s._id) } 
        });

        console.log(`\nCleanup completed:`);
        console.log(`- Removed ${result.deletedCount} vehicles`);
        console.log(`- From ${unmanagedStations.length} unmanaged stations`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

cleanup();