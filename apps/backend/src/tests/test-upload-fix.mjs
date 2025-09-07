import fs from 'fs';
import fetch from 'node-fetch';

async function testUploadWithAuth() {
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
    console.log('Token received:', token);
    
    // Read a test file
    console.log('Reading test file...');
    // Check if the file exists first
    const filePath = './examples/pptx/089306003634_Đinh Thị Xuân Nhi_BaiThietKePowerpoint.pptx';
    if (!fs.existsSync(filePath)) {
      console.error('Test file not found:', filePath);
      return;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload the file with authentication
    console.log('Uploading file with authentication...');
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test-file.pptx');
    // Add a custom rubric ID to trigger automatic grading
    // We'll use a valid rubric ID if we can find one, or skip this for now
    // formData.append('customRubricId', 'test-rubric-id');
    
    const uploadResponse = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': `token=${token}`
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));
    
    if (!uploadData.success) {
      console.error('Upload failed:', uploadData.message);
      return;
    }
    
    console.log('Upload test completed successfully!');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testUploadWithAuth();