/**
 * Performance Test Script
 * Makes 5-10 rapid API calls and shows response times
 */

const API_URL = 'http://localhost:3000/api';

async function makeApiCall(endpoint, label) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ ${label}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data Count: ${data.data?.data?.length || data.data?.length || 1} items`);
    console.log('');
    
    return { label, responseTime, success: true };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`❌ ${label}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    return { label, responseTime, success: false, error: error.message };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test - 10 Rapid API Calls\n');
  console.log('='.repeat(60));
  console.log('');
  
  const results = [];
  
  // Test 1: Get tokens (first call - cache miss)
  results.push(await makeApiCall('/tokens?limit=10', 'Test 1: Get Tokens (Initial - Cache Miss)'));
  
  // Test 2: Get tokens (second call - cache hit)
  results.push(await makeApiCall('/tokens?limit=10', 'Test 2: Get Tokens (Cache Hit)'));
  
  // Test 3: Get tokens with sorting
  results.push(await makeApiCall('/tokens?limit=10&sortBy=price_change', 'Test 3: Get Tokens (Sort by Price Change)'));
  
  // Test 4: Get tokens with different period
  results.push(await makeApiCall('/tokens?limit=5&period=1h', 'Test 4: Get Tokens (1h Period)'));
  
  // Test 5: Search tokens
  results.push(await makeApiCall('/search?q=SOL', 'Test 5: Search Tokens (SOL)'));
  
  // Test 6: Search tokens (cached)
  results.push(await makeApiCall('/search?q=SOL', 'Test 6: Search Tokens (Cache Hit)'));
  
  // Test 7: Get specific token
  results.push(await makeApiCall('/tokens/576P1t7XsRL4ZVj38LV2eYWxXRPguBADA8BxcNz1xo8y', 'Test 7: Get Token by Address'));
  
  // Test 8: Get tokens with filters
  results.push(await makeApiCall('/tokens?limit=20&sortBy=volume&order=desc', 'Test 8: Get Tokens (Volume Sorted)'));
  
  // Test 9: Health check
  results.push(await makeApiCall('/health', 'Test 9: Health Check'));
  
  // Test 10: Get tokens again (cache hit)
  results.push(await makeApiCall('/tokens?limit=10', 'Test 10: Get Tokens (Final Cache Hit)'));
  
  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Performance Summary\n');
  
  const successfulCalls = results.filter(r => r.success);
  const failedCalls = results.filter(r => !r.success);
  
  if (successfulCalls.length > 0) {
    const avgTime = successfulCalls.reduce((sum, r) => sum + r.responseTime, 0) / successfulCalls.length;
    const minTime = Math.min(...successfulCalls.map(r => r.responseTime));
    const maxTime = Math.max(...successfulCalls.map(r => r.responseTime));
    
    console.log(`Total Calls:        ${results.length}`);
    console.log(`Successful:         ${successfulCalls.length} ✅`);
    console.log(`Failed:             ${failedCalls.length} ❌`);
    console.log(`\nResponse Times:`);
    console.log(`  Average:          ${avgTime.toFixed(2)}ms`);
    console.log(`  Fastest:          ${minTime}ms`);
    console.log(`  Slowest:          ${maxTime}ms`);
    console.log(`\n✨ Cache Performance:`);
    
    // Compare first call vs cached calls
    const firstCall = results[0];
    const cachedCalls = [results[1], results[5], results[9]];
    const avgCachedTime = cachedCalls
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / cachedCalls.filter(r => r.success).length;
    
    if (firstCall.success && avgCachedTime) {
      const improvement = ((firstCall.responseTime - avgCachedTime) / firstCall.responseTime * 100).toFixed(1);
      console.log(`  Initial Call:     ${firstCall.responseTime}ms`);
      console.log(`  Cached Avg:       ${avgCachedTime.toFixed(2)}ms`);
      console.log(`  Improvement:      ${improvement}% faster with cache 🚀`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Performance test completed!\n');
}

// Run the test
console.log('⏳ Make sure the server is running on http://localhost:3000\n');
runPerformanceTest().catch(console.error);
