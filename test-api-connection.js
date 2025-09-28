// Quick API Connection Test
// Open browser console and paste this code to test the connection

console.log('Testing API connection...');

// Test basic connectivity
fetch('https://eduplanner2-3wye.onrender.com/')
  .then(response => {
    console.log('✅ Backend is reachable:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Backend response:', data);
  })
  .catch(error => {
    console.error('❌ Backend connection failed:', error);
  });

// Test CORS with login endpoint
fetch('https://eduplanner2-3wye.onrender.com/login', {
  method: 'OPTIONS',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => {
    console.log('✅ CORS preflight passed:', response.status);
  })
  .catch(error => {
    console.error('❌ CORS preflight failed:', error);
  });

// Test actual login call
fetch('https://eduplanner2-3wye.onrender.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword'
  })
})
  .then(response => {
    console.log('✅ Login endpoint reachable:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Login response:', data);
  })
  .catch(error => {
    console.error('❌ Login failed:', error);
  });