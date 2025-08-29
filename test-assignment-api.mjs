// Test script to verify assignment fetching for learners
async function testAssignmentAPI() {
  try {
    console.log('🧪 Testing assignment API endpoint...\n');
    
    // Test without authentication first
    console.log('1. Testing without authentication...');
    const unauthenticatedResponse = await fetch('http://localhost:3000/api/assignments/published?learnerView=true');
    console.log('Status:', unauthenticatedResponse.status);
    const unauthenticatedData = await unauthenticatedResponse.json();
    console.log('Response:', unauthenticatedData);
    
    // You would need to replace this token with a real JWT token from your application
    console.log('\n2. Testing with authentication (you need to provide a valid token)...');
    console.log('To test with authentication:');
    console.log('1. Login to your app and get the JWT token from localStorage');
    console.log('2. Replace "YOUR_JWT_TOKEN_HERE" below with the actual token');
    console.log('3. Run this script again');
    
    const testToken = "YOUR_JWT_TOKEN_HERE";
    if (testToken !== "YOUR_JWT_TOKEN_HERE") {
      const authenticatedResponse = await fetch('http://localhost:3000/api/assignments/published?learnerView=true', {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Authenticated Status:', authenticatedResponse.status);
      const authenticatedData = await authenticatedResponse.json();
      console.log('Authenticated Response:', authenticatedData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAssignmentAPI();