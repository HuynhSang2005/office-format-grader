import fs from 'fs';
import fetch from 'node-fetch';

async function testPPTXUploadAndGrade() {
  try {
    // Read the test PPTX file
    const fileBuffer = fs.readFileSync('./examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
    
    // Upload the file
    console.log('Uploading PPTX file...');
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), '049306003690-Nguyễn Đoan Trang-DEPPT01.pptx');
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms'
      },
      body: formData
    });
    
    const uploadData = await uploadResponse.json();
    console.log('Upload response:', uploadData);
    
    if (!uploadData.success) {
      console.error('Upload failed:', uploadData.message);
      return;
    }
    
    const fileId = uploadData.data.fileId;
    console.log('File uploaded successfully with ID:', fileId);
    
    // Grade the file
    console.log('Grading file...');
    const gradeResponse = await fetch('http://localhost:3000/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms'
      },
      body: JSON.stringify({ fileId })
    });
    
    const gradeData = await gradeResponse.json();
    console.log('Grade response:', JSON.stringify(gradeData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPPTXUploadAndGrade();