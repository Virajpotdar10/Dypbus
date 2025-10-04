const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../models/Route');
const Driver = require('../models/Driver');

// Load env vars
dotenv.config({ path: './config/config.env' });

const seedRoutes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get existing drivers
    const drivers = await Driver.find();
    if (drivers.length === 0) {
      console.log('No drivers found. Please run seedDatabase.js first to create drivers.');
      process.exit(1);
    }

    // Clear existing routes
    await Route.deleteMany({});
    console.log('Cleared existing routes');

    // Create initial routes
    const routes = [
      {
        routeName: 'Pune to DYPCET',
        startLocation: 'Pune Station',
        endLocation: 'DYPCET College',
        stops: ['Pune Station', 'Shivaji Nagar', 'Kothrud', 'DYPCET College'],
        driver: drivers[0]._id, // First driver
        busNumber: 'MH12AB1234',
        capacity: 50,
        timing: '8:00 AM'
      },
      {
        routeName: 'Akurdi to DYPCET',
        startLocation: 'Akurdi Station',
        endLocation: 'DYPCET College',
        stops: ['Akurdi Station', 'Nigdi', 'Bhosari', 'DYPCET College'],
        driver: drivers[1] ? drivers[1]._id : drivers[0]._id, // Second driver or first if only one
        busNumber: 'MH12CD5678',
        capacity: 45,
        timing: '7:30 AM'
      },
      {
        routeName: 'Hadapsar to DYPSEM',
        startLocation: 'Hadapsar',
        endLocation: 'DYPSEM College',
        stops: ['Hadapsar', 'Magarpatta', 'Kharadi', 'DYPSEM College'],
        driver: drivers[0]._id, // First driver
        busNumber: 'MH12EF9012',
        capacity: 40,
        timing: '8:15 AM'
      }
    ];

    // Insert routes
    const createdRoutes = await Route.create(routes);
    console.log('Created routes:', createdRoutes.map(r => ({ 
      routeName: r.routeName, 
      driver: r.driver,
      busNumber: r.busNumber 
    })));

    console.log('Routes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding routes:', error);
    process.exit(1);
  }
};

seedRoutes();
