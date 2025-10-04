const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Driver = require('../models/Driver');

// Load env vars
dotenv.config({ path: '../config/config.env' });

const testRegistration = async () => {
  try {
    console.log('🧪 Starting Registration Test...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/busdriver', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');
    console.log('📍 Database:', mongoose.connection.name);

    // Count existing drivers
    const initialCount = await Driver.countDocuments();
    console.log('📊 Initial driver count:', initialCount);

    // Test user data
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'driver'
    };

    console.log('👤 Creating test user:', testUser.name, testUser.email);

    // Create test driver
    const driver = await Driver.create(testUser);
    
    console.log('✅ Test driver created:');
    console.log('   - ID:', driver._id);
    console.log('   - Name:', driver.name);
    console.log('   - Email:', driver.email);
    console.log('   - Role:', driver.role);

    // Verify creation
    const foundDriver = await Driver.findById(driver._id);
    if (foundDriver) {
      console.log('✅ Verification: Driver found in database');
    } else {
      console.log('❌ Verification failed: Driver not found');
    }

    // Count drivers after creation
    const finalCount = await Driver.countDocuments();
    console.log('📊 Final driver count:', finalCount);
    console.log('📈 Drivers added:', finalCount - initialCount);

    // List all drivers
    const allDrivers = await Driver.find({}, 'name email role');
    console.log('👥 All drivers in database:');
    allDrivers.forEach((d, index) => {
      console.log(`   ${index + 1}. ${d.name} (${d.email}) - ${d.role}`);
    });

    // Clean up test user
    await Driver.findByIdAndDelete(driver._id);
    console.log('🧹 Test user cleaned up');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    console.log('✅ Registration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Registration test failed:');
    console.error('   - Error:', error.message);
    console.error('   - Stack:', error.stack);
    process.exit(1);
  }
};

testRegistration();
