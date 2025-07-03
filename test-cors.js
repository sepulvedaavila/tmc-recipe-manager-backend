/**
 * Test CORS configuration
 */

const axios = require('axios');

// Test URLs - update these with your actual URLs
const BACKEND_URL = process.env.BACKEND_URL || 'https://tmc-recipe-manager-backend.vercel.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://tmc-recipe-manager-frontend.vercel.app';

async function testCors() {
  console.log('🧪 Testing CORS Configuration...\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  const testOrigins = [
    'https://app.themenucompany.mx',
    'https://tmc-recipe-manager-frontend.vercel.app',
    'https://tmc-recipe-manager-backend.vercel.app',
    'http://localhost:3000',
    'https://malicious-site.com' // This should be blocked
  ];

  for (const origin of testOrigins) {
    console.log(`Testing origin: ${origin}`);
    
    try {
      // Test OPTIONS request (preflight)
      const optionsResponse = await axios.options(`${BACKEND_URL}/api/health`, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      const allowOrigin = optionsResponse.headers['access-control-allow-origin'];
      const allowCredentials = optionsResponse.headers['access-control-allow-credentials'];
      
      if (allowOrigin === origin || allowOrigin === '*') {
        console.log(`  ✅ ALLOWED - Origin: ${origin}`);
        console.log(`     Allow-Origin: ${allowOrigin}`);
        console.log(`     Allow-Credentials: ${allowCredentials}`);
      } else {
        console.log(`  ❌ BLOCKED - Origin: ${origin}`);
        console.log(`     Allow-Origin: ${allowOrigin}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ ERROR - Origin: ${origin}`);
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Message: ${error.response.data?.message || error.message}`);
      } else {
        console.log(`  ❌ NETWORK ERROR - Origin: ${origin}`);
        console.log(`     Error: ${error.message}`);
      }
    }
    
    console.log('');
  }

  // Test actual GET request
  console.log('Testing actual GET request from frontend origin...');
  try {
    const getResponse = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': 'https://tmc-recipe-manager-frontend.vercel.app'
      }
    });
    
    console.log('✅ GET request successful');
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Allow-Origin: ${getResponse.headers['access-control-allow-origin']}`);
    
  } catch (error) {
    console.log('❌ GET request failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCors();
}

module.exports = testCors; 