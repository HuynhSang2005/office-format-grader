import fetch from 'node-fetch';

async function debugResponse() {
  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response Text:', text);
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', json);
    } catch (e) {
      console.log('Not valid JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugResponse();