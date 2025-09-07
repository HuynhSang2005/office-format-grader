import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU3MjI0MjkwLCJleHAiOjE3NTczMTA2OTAsInN1YiI6IjEifQ._07Eg_Zfoq6xXEnsFcVPX68TAz0t72D72q3KsbwV3Ms';

async function testCustomRubricCreation() {
  console.log('=== Testing Custom Rubric Creation ===');
  
  try {
    // Create a minimal rubric that should pass validation
    const customRubric = {
      ownerId: 1,
      name: 'Test Rubric',
      content: {
        "title": "Test Word Rubric",
        "version": "1.0",
        "locale": "vi-VN",
        "description": "Rubric for testing",
        "fileType": "DOCX",
        "totalPoints": 10,
        "scoring": {
          "method": "sum",
          "rounding": "half_up_0.25"
        },
        "criteria": [
          {
            "id": "docx_toc",
            "name": "Mục lục tự động",
            "description": "Tạo mục lục (Table of Contents) tự động",
            "detectorKey": "docx.toc",
            "maxPoints": 1,
            "levels": [
              {
                "code": "toc_0",
                "name": "Không có",
                "points": 0,
                "description": "Không có mục lục hoặc tạo thủ công"
              },
              {
                "code": "toc_1",
                "name": "Cơ bản",
                "points": 0.5,
                "description": "Có mục lục tự động nhưng chưa đầy đủ"
              },
              {
                "code": "toc_2",
                "name": "Hoàn chỉnh",
                "points": 1,
                "description": "TOC tự động đầy đủ, phân cấp, số trang chính xác"
              }
            ]
          }
        ]
      },
      isPublic: false
    };
    
    console.log('Sending rubric:', JSON.stringify(customRubric, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/custom-rubrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${AUTH_TOKEN}`
      },
      body: JSON.stringify(customRubric)
    });
    
    const data = await response.json();
    console.log('Custom rubric creation response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error in custom rubric creation test:', error);
  }
}

testCustomRubricCreation().catch(console.error);