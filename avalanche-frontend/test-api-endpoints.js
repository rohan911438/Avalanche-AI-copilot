// test-api-endpoints.js
// Script to test the API endpoints

const fetch = require('node-fetch');

async function testEndpoints() {
  const BASE_URL = 'http://localhost:3000/api';
  
  console.log('Testing API endpoints...');
  
  try {
    // Test generate endpoint
    console.log('\n📝 Testing /api/generate endpoint...');
    const generateRes = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Create a simple ERC20 token contract' })
    });
    
    const generateData = await generateRes.json();
    console.log('Status:', generateRes.status, generateRes.ok ? '✅' : '❌');
    console.log('Response preview:', 
      generateData.contractCode 
        ? `Contract generated (${generateData.contractCode.length} chars)` 
        : 'Error: ' + generateData.error
    );
    
    // Test explain endpoint
    console.log('\n📖 Testing /api/explain endpoint...');
    const sampleContract = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      
      contract SimpleStorage {
          uint256 private value;
          
          function setValue(uint256 _value) public {
              value = _value;
          }
          
          function getValue() public view returns (uint256) {
              return value;
          }
      }
    `;
    
    const explainRes = await fetch(`${BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractCode: sampleContract })
    });
    
    const explainData = await explainRes.json();
    console.log('Status:', explainRes.status, explainRes.ok ? '✅' : '❌');
    console.log('Response preview:', 
      explainData.explanation 
        ? `Explanation generated (${explainData.explanation.length} chars)` 
        : 'Error: ' + explainData.error
    );
    
    console.log('\n✨ Testing complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEndpoints();