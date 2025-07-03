require('dotenv').config();

console.log('Environment Variables Test');
console.log('==========================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'NOT SET');

// Test if we can require the server
try {
  console.log('\nTesting server import...');
  const app = require('./server');
  console.log('✅ Server imported successfully');
} catch (error) {
  console.error('❌ Server import failed:', error.message);
  console.error('Stack:', error.stack);
} 