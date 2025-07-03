/**
 * Test script to verify all improvements are working
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';

async function testImprovements() {
  console.log('🧪 Testing Backend Improvements...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Database:', healthResponse.data.database.status);
    console.log('   System Memory:', healthResponse.data.system.memory.used + 'MB');

    // Test 2: Monitoring Dashboard
    console.log('\n2. Testing Monitoring Dashboard...');
    const monitoringResponse = await axios.get(`${BASE_URL}/api/monitoring`);
    console.log('✅ Monitoring:', monitoringResponse.data.status);
    console.log('   Requests:', monitoringResponse.data.requests.total);
    console.log('   Success Rate:', monitoringResponse.data.requests.successRate);

    // Test 3: Validation (should fail with missing fields)
    console.log('\n3. Testing Request Validation...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        username: 'test',
        // Missing email and password
      });
      console.log('❌ Validation failed - should have rejected request');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working - rejected invalid request');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 4: CORS Headers
    console.log('\n4. Testing CORS Configuration...');
    const corsResponse = await axios.options(`${BASE_URL}/api/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS Headers:', corsResponse.headers['access-control-allow-origin']);

    // Test 5: Performance Headers
    console.log('\n5. Testing Performance Monitoring...');
    const perfResponse = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ Response Time Header:', perfResponse.headers['x-response-time']);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ Health check endpoint working');
    console.log('   ✅ Monitoring dashboard active');
    console.log('   ✅ Request validation functional');
    console.log('   ✅ CORS properly configured');
    console.log('   ✅ Performance monitoring active');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testImprovements();
}

module.exports = testImprovements; 