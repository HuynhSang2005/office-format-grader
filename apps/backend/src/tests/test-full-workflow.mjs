import fs from 'fs';
import fetch from 'node-fetch';

async function testFullWorkflow() {
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
    
    // Create a custom rubric
    console.log('Creating custom rubric...');
    const rubricResponse = await fetch('http://localhost:3001/api/custom-rubrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      },
      body: JSON.stringify({
        name: 'Test Rubric',
        content: {
          criteria: [
            {
              id: '1',
              name: 'Content Quality',
              description: 'Assess the quality of content',
              maxPoints: 5,
              weight: 0.5
            },
            {
              id: '2',
              name: 'Design',
              description: 'Assess the design elements',
              maxPoints: 5,
              weight: 0.5
            }
          ]
        },
        total: 10,
        isPublic: false
      })
    });
    
    const rubricData = await rubricResponse.json();
    console.log('Rubric response:', JSON.stringify(rubricData, null, 2));
    
    if (!rubricData.success) {
      console.error('Rubric creation failed:', rubricData.message);
      return;
    }
    
    const rubricId = rubricData.data.id;
    console.log('Rubric created with ID:', rubricId);
    
    // Read a test file
    console.log('Reading test file...');
    const filePath = './examples/pptx/089306003634_Đinh Thị Xuân Nhi_BaiThietKePowerpoint.pptx';
    if (!fs.existsSync(filePath)) {
      console.error('Test file not found:', filePath);
      return;
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload the file with authentication and custom rubric ID for automatic grading
    console.log('Uploading file with automatic grading...');
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test-file.pptx');
    formData.append('customRubricId', rubricId);
    
    const uploadResponse = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': `token=${token}`
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('Upload with grading response:', JSON.stringify(uploadData, null, 2));
    
    if (!uploadData.success) {
      console.error('Upload with grading failed:', uploadData.message);
      return;
    }
    
    console.log('Full workflow test completed successfully!');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testFullWorkflow();