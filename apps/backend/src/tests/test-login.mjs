import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    return data.token;
  } catch (error) {
    console.error('Login error:', error);
  }
}

testLogin();