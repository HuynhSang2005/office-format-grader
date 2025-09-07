import fs from 'fs';
import fetch from 'node-fetch';

async function debugUpload() {
  try {
    // Read a real DOCX file
    const fileBuffer = fs.readFileSync('./examples/docx/046306011637-LE TRAN MINH THU-DEWO1.DOCX');
    
    // Create form data manually
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.docx"',
      'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '',
      fileBuffer,
      `--${boundary}--`,
      ''
    ].join('\r\n');
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Cookie': 'token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms'
      },
      body: body
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

debugUpload();