const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Driver = require('../models/Driver');

// Load env vars
dotenv.config({ path: '../config/config.env' });

const updateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/busdriver', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find existing admin user
    const existingAdmin = await Driver.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Found existing admin:', existingAdmin.email);
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      // Update admin credentials
      await Driver.findByIdAndUpdate(existingAdmin._id, {
        email: 'virajpotdar7845@gmail.com',
        password: hashedPassword
      });
      
      console.log('✅ Admin credentials updated successfully!');
      console.log('📧 New email: virajpotdar7845@gmail.com');
      console.log('🔑 New password: 123456');
    } else {
      // Create new admin if none exists
      console.log('No existing admin found, creating new admin...');
      
      const newAdmin = await Driver.create({
        name: 'Admin User',
        email: 'virajpotdar7845@gmail.com',
        password: '123456',
        role: 'admin'
      });
      
      console.log('✅ New admin created successfully!');
      console.log('📧 Email: virajpotdar7845@gmail.com');
      console.log('🔑 Password: 123456');
    }

    // Verify the update
    const updatedAdmin = await Driver.findOne({ email: 'virajpotdar7845@gmail.com' });
    if (updatedAdmin) {
      console.log('✅ Verification: Admin found with new email');
      console.log('👤 Name:', updatedAdmin.name);
      console.log('📧 Email:', updatedAdmin.email);
      console.log('🎭 Role:', updatedAdmin.role);
    }

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error(' Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
