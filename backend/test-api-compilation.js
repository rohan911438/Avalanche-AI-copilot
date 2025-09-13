// Test script for contract compilation
// Simulates an API request to compile our SimpleTest contract

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for required dependencies
try {
  require('axios');
} catch (error) {
  console.error('Missing dependency: axios');
  console.log('Installing axios...');
  try {
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('Axios installed successfully.');
  } catch (installError) {
    console.error('Failed to install axios:', installError.message);
    process.exit(1);
  }
}

// After dynamically ensuring dependencies are installed, import axios
const axios = require('axios');

// Ensure the backend server is running
console.log('Checking if backend server is running...');
try {
  execSync('curl http://localhost:3001', { stdio: 'pipe' });
  console.log('Backend server is running.');
} catch (error) {
  console.error('Backend server is not running. Please start it first.');
  console.log('You can start it by running: cd backend && node server.js');
  process.exit(1);
}

// Read the test contract
const contractPath = path.join(__dirname, '..', 'hardhat-project', 'contracts', 'SimpleTest.sol');
const contractCode = fs.readFileSync(contractPath, 'utf8');

// Call the backend directly for testing
async function testCompilation() {
  try {
    console.log('Testing contract compilation...');
    console.log('Contract length:', contractCode.length);
    
    // Call the backend API with the contract code and explicitly specify the contract name
    const response = await axios.post('http://localhost:3001/api/deploy/compile', {
      contractCode,
      contractName: 'SimpleTest.sol' // Use the actual contract name that matches our test file
    });
    
    console.log('Compilation result:', JSON.stringify(response.data, null, 2));
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

testCompilation();