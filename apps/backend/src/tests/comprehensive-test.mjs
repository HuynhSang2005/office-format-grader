import fs from 'fs';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms';

// Helper function to make authenticated requests
async function authenticatedRequest(url, options = {}) {
  const defaultHeaders = {
    'Cookie': `token=${AUTH_TOKEN}`
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };
  
  return fetch(`${BASE_URL}${url}`, config);
}

// Helper function to upload a file
async function uploadFile(filePath, fileName) {
  console.log(`Uploading file: ${fileName}`);
  const fileBuffer = fs.readFileSync(filePath);
  
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);
  
  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Cookie': `token=${AUTH_TOKEN}`
    },
    body: formData
  });
  
  return await response.json();
}

// Test 1: Upload compressed files (.zip and .rar)
async function testCompressedFileUpload() {
  console.log('\n=== Testing Compressed File Upload ===');
  
  try {
    // Create a ZIP file with a DOCX file
    console.log('Creating ZIP file with DOCX...');
    const zip = new AdmZip();
    zip.addLocalFile('./examples/docx/046306011637-LE TRAN MINH THU-DEWO1.DOCX');
    zip.writeZip('./temp_test.zip');
    
    // Try to upload the ZIP file (should fail)
    const zipUploadResponse = await uploadFile('./temp_test.zip', 'test_files.zip');
    console.log('ZIP upload response:', JSON.stringify(zipUploadResponse, null, 2));
    
    // Clean up
    if (fs.existsSync('./temp_test.zip')) {
      fs.unlinkSync('./temp_test.zip');
    }
    
    // Test RAR file (if we have one or can create one)
    // Note: Creating RAR files programmatically is complex, so we'll skip this for now
    // In a real test, we would create or find a RAR file to test
    
  } catch (error) {
    console.error('Error in compressed file upload test:', error);
  }
}

// Test 2: Upload multiple files
async function testMultipleFileUpload() {
  console.log('\n=== Testing Multiple File Upload ===');
  
  try {
    // Test uploading multiple files one by one
    console.log('Uploading first DOCX file...');
    const upload1 = await uploadFile('./examples/docx/046306011637-LE TRAN MINH THU-DEWO1.DOCX', 'test1.DOCX');
    console.log('First upload response:', JSON.stringify(upload1, null, 2));
    
    console.log('Uploading second DOCX file...');
    const upload2 = await uploadFile('./examples/docx/052206004465- Hà Quốc Nguyên Sinh_DEW01.DOCX', 'test2.DOCX');
    console.log('Second upload response:', JSON.stringify(upload2, null, 2));
    
    console.log('Uploading PPTX file...');
    const upload3 = await uploadFile('./examples/pptx/049306003690-Nguyễn Đoan Trang-DEPPT01.pptx', 'test3.pptx');
    console.log('Third upload response:', JSON.stringify(upload3, null, 2));
    
  } catch (error) {
    console.error('Error in multiple file upload test:', error);
  }
}

// Test 3: Export functionality
async function testExportFunctionality() {
  console.log('\n=== Testing Export Functionality ===');
  
  try {
    // First, upload and grade a file to have something to export
    console.log('Uploading file for export test...');
    const uploadResponse = await uploadFile('./examples/docx/046306011637-LE TRAN MINH THU-DEWO1.DOCX', 'export_test.DOCX');
    
    if (!uploadResponse.success) {
      console.error('Failed to upload file for export test');
      return;
    }
    
    const fileId = uploadResponse.data.fileId;
    
    // Grade the file
    console.log('Grading file for export test...');
    const gradeResponse = await authenticatedRequest('/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId })
    });
    
    const gradeData = await gradeResponse.json();
    console.log('Grade response:', JSON.stringify(gradeData, null, 2));
    
    if (!gradeData.success) {
      console.error('Failed to grade file for export test');
      return;
    }
    
    // For export testing, we would need the actual grade result ID from the database
    // Since we don't have direct access to the database in this test, we'll skip the actual export test
    console.log('Export functionality test completed (actual export test skipped due to database access limitations)');
    
  } catch (error) {
    console.error('Error in export functionality test:', error);
  }
}

// Test 4: Dashboard endpoint
async function testDashboardEndpoint() {
  console.log('\n=== Testing Dashboard Endpoint ===');
  
  try {
    const response = await authenticatedRequest('/api/dashboard');
    const data = await response.json();
    console.log('Dashboard response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error in dashboard endpoint test:', error);
  }
}

// Test 5: Create custom rubric
async function testCustomRubricCreation() {
  console.log('\n=== Testing Custom Rubric Creation ===');
  
  try {
    // Load an existing rubric as template
    const defaultRubric = JSON.parse(fs.readFileSync('./src/config/presets/defaultRubric.docx.json', 'utf8'));
    
    // Create a custom rubric based on the default one
    const customRubric = {
      ownerId: 1,
      name: 'My Custom DOCX Rubric Based on Default',
      content: defaultRubric,
      isPublic: false
    };
    
    const response = await authenticatedRequest('/api/custom-rubrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customRubric)
    });
    
    const data = await response.json();
    console.log('Custom rubric creation response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const rubricId = data.data.id;
      
      // Test updating the rubric
      console.log('Testing rubric update...');
      const updateResponse = await authenticatedRequest(`/api/custom-rubrics/${rubricId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated Custom DOCX Rubric',
          isPublic: true
        })
      });
      
      const updateData = await updateResponse.json();
      console.log('Custom rubric update response:', JSON.stringify(updateData, null, 2));
      
      // Test getting the rubric
      console.log('Testing rubric retrieval...');
      const getResponse = await authenticatedRequest(`/api/custom-rubrics/${rubricId}`);
      const getData = await getResponse.json();
      console.log('Custom rubric get response:', JSON.stringify(getData, null, 2));
      
      // Test listing rubrics
      console.log('Testing rubric listing...');
      const listResponse = await authenticatedRequest('/api/custom-rubrics');
      const listData = await listResponse.json();
      console.log('Custom rubric list response:', JSON.stringify(listData, null, 2));
      
      // Test deleting the rubric
      console.log('Testing rubric deletion...');
      const deleteResponse = await authenticatedRequest(`/api/custom-rubrics/${rubricId}`, {
        method: 'DELETE'
      });
      
      const deleteData = await deleteResponse.json();
      console.log('Custom rubric delete response:', JSON.stringify(deleteData, null, 2));
    }
    
  } catch (error) {
    console.error('Error in custom rubric creation test:', error);
  }
}

// Main test function
async function runAllTests() {
  console.log('Starting comprehensive tests...\n');
  
  await testCompressedFileUpload();
  await testMultipleFileUpload();
  await testExportFunctionality();
  await testDashboardEndpoint();
  await testCustomRubricCreation();
  
  console.log('\nAll tests completed.');
}

// Run the tests
runAllTests().catch(console.error);