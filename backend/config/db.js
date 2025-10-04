const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📍 MongoDB URI:', process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully:');
    console.log('   - Host:', conn.connection.host);
    console.log('   - Port:', conn.connection.port);
    console.log('   - Database Name:', conn.connection.name);
    console.log('   - Connection State:', conn.connection.readyState);
    
    // Add connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error(' Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log(' Mongoose disconnected from MongoDB');
    });

  } catch (err) {
    console.error(' Database connection error:');
    console.error('   - Error name:', err.name);
    console.error('   - Error message:', err.message);
    console.error('   - MongoDB URI:', process.env.MONGO_URI);
    process.exit(1);
  }
};

module.exports = connectDB;
