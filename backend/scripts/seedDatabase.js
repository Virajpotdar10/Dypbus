const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Driver = require('../models/Driver');

// Load env vars
dotenv.config({ path: './config/config.env' });

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users
    await Driver.deleteMany({});
    console.log('Cleared existing users');

    // Create initial users
    const users = [
      {
        name: 'Viraj Potdar',
        email: 'viraj@example.com',
        password: 'driver123',
        role: 'driver'
      },
      {
        name: 'Viraj Potdar Admin',
        email: 'virajpotdar7845@gmail.com',
        password: 'viraj2024',
        role: 'driver'
      },
      {
        name: 'Admin User',
        email: 'virajpotdar7845@gmail.com',
        password: '123456',
        role: 'admin'
      }
    ];

    // Insert users
    const createdUsers = await Driver.create(users);
    console.log('Created users:', createdUsers.map(u => ({ name: u.name, email: u.email, role: u.role })));

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();
