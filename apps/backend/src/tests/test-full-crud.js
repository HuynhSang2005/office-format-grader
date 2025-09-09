// Test script to verify full criteria CRUD operations
async function testFullCRUD() {
  try {
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123"
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }
    
    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    console.log('Login successful');
    
    // 2. Create a criterion
    console.log('2. Creating a criterion...');
    const criterionData = {
      name: "Test Criterion for CRUD",
      description: "A test criterion for full CRUD testing",
      detectorKey: "docx.toc",
      maxPoints: 5,
      levels: [
        {
          points: 0,
          code: "0",
          name: "Không đạt",
          description: "Không đạt yêu cầu"
        },
        {
          points: 5,
          code: "5",
          name: "Đạt",
          description: "Đạt yêu cầu"
        }
      ]
    };
    
    const createResponse = await fetch('http://localhost:3000/api/criteria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(criterionData)
    });
    
    const createResult = await createResponse.json();
    if (!createResponse.ok) {
      console.error('Failed to create criterion:', createResult);
      return;
    }
    
    const criterionId = createResult.data.id;
    console.log('✓ Criterion created with ID:', criterionId);
    
    // 3. Get the specific criterion
    console.log('3. Getting the specific criterion...');
    const getResponse = await fetch(`http://localhost:3000/api/criteria/${criterionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const getResult = await getResponse.json();
    if (!getResponse.ok) {
      console.error('Failed to get criterion:', getResult);
      return;
    }
    
    console.log('✓ Criterion retrieved successfully');
    console.log('Criterion name:', getResult.data.name);
    
    // 4. Update the criterion
    console.log('4. Updating the criterion...');
    const updateData = {
      name: "Updated Test Criterion",
      description: "An updated test criterion for full CRUD testing",
      maxPoints: 10
    };
    
    const updateResponse = await fetch(`http://localhost:3000/api/criteria/${criterionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    if (!updateResponse.ok) {
      console.error('Failed to update criterion:', updateResult);
      return;
    }
    
    console.log('✓ Criterion updated successfully');
    console.log('Updated name:', updateResult.data.name);
    console.log('Updated maxPoints:', updateResult.data.maxPoints);
    
    // 5. List all criteria to verify update
    console.log('5. Listing all criteria to verify update...');
    const listResponse = await fetch('http://localhost:3000/api/criteria/all', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const listResult = await listResponse.json();
    if (!listResponse.ok) {
      console.error('Failed to list criteria:', listResult);
      return;
    }
    
    const updatedCriterion = listResult.data.criteria.find(c => c.id === criterionId);
    console.log('✓ Criteria listed successfully');
    console.log('Found updated criterion:', updatedCriterion.name, '(maxPoints:', updatedCriterion.maxPoints, ')');
    
    // 6. Delete the criterion
    console.log('6. Deleting the criterion...');
    const deleteResponse = await fetch(`http://localhost:3000/api/criteria/${criterionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.error('Failed to delete criterion:', deleteResult);
      return;
    }
    
    console.log('✓ Criterion deleted successfully');
    
    // 7. Verify deletion by trying to get the criterion
    console.log('7. Verifying deletion...');
    const verifyResponse = await fetch(`http://localhost:3000/api/criteria/${criterionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (verifyResponse.status === 404) {
      console.log('✓ Criterion deletion verified - criterion no longer exists');
    } else {
      const verifyResult = await verifyResponse.json();
      console.log('Unexpected response when verifying deletion:', verifyResult);
    }
    
    console.log('\n🎉 All CRUD operations completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testFullCRUD();