import fs from 'fs';
import fetch from 'node-fetch';

async function testUpload() {
  try {
    // Read the test file
    const fileBuffer = fs.readFileSync('./test.txt');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test.txt');
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms'
      },
      body: formData
    });
    
    const data = await response.json();
    console.log('Upload response:', data);
    return data;
  } catch (error) {
    console.error('Upload error:', error);
  }
}

testUpload();