const connectDB = require('./mongodb');

const testConnection = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

testConnection(); 