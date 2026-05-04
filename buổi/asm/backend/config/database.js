const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // show a masked version of the URI for debugging (don't print raw password)
    try {
      const masked = process.env.MONGODB_URI.replace(/:[^@]+@/, ':<pwd>@');
      console.log('🔎 Attempting MongoDB connection with:', masked);
    } catch (e) {
      console.log('🔎 Attempting MongoDB connection (unable to mask URI)');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;