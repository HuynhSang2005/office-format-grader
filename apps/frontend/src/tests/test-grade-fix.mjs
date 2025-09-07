import fs from 'fs';
import fetch from 'node-fetch';

async function testGradeFix() {
  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.token;
    console.log('Token received');
    
    // Get ungraded files
    console.log('Getting ungraded files...');
    const ungradedResponse = await fetch('http://localhost:3001/api/ungraded', {
      method: 'GET',
      headers: {
        'Cookie': `token=${token}`
      }
    });
    
    const ungradedData = await ungradedResponse.json();
    console.log('Ungraded files response:', JSON.stringify(ungradedData, null, 2));
    
    if (!ungradedData.success || !ungradedData.data.files || ungradedData.data.files.length === 0) {
      console.log('No ungraded files found');
      return;
    }
    
    const fileId = ungradedData.data.files[0].id;
    console.log('Found ungraded file with ID:', fileId);
    
    // Grade the file with the default hard-coded rubric (should use /api/grade, not /api/grade/custom)
    console.log('Grading file with default rubric...');
    const gradeResponse = await fetch('http://localhost:3001/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({
        fileId: fileId
      })
    });
    
    const gradeData = await gradeResponse.json();
    console.log('Grade response:', JSON.stringify(gradeData, null, 2));
    
    if (!gradeData.success) {
      console.error('Grading failed:', gradeData.message);
      return;
    }
    
    console.log('✅ Grade test completed successfully!');
    console.log('✅ File was graded with default hard-coded rubric');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testGradeFix();