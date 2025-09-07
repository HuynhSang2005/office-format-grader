import fs from 'fs';
import fetch from 'node-fetch';

async function finalTest() {
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
    
    // Read a test file
    console.log('Reading test file...');
    const filePath = './examples/pptx/089306003634_Đinh Thị Xuân Nhi_BaiThietKePowerpoint.pptx';
    if (!fs.existsSync(filePath)) {
      console.error('Test file not found:', filePath);
      return;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload the file with authentication (without custom rubric for now)
    console.log('Uploading file with authentication...');
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test-file.pptx');
    
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
    
    console.log('✅ Upload test completed successfully!');
    console.log('✅ File ID:', uploadData.data.fileId);
    console.log('✅ File was saved to database as ungraded file');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

finalTest();