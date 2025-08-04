#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Starting Comprehensive App Tests...');
console.log('=' .repeat(50));

// Run the comprehensive test
const testCommand = 'npx cypress run --spec "cypress/e2e/comprehensive-test.cy.js" --headless';

exec(testCommand, { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Test execution failed:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️  Test warnings:', stderr);
  }
  
  console.log('📊 Test Results:');
  console.log(stdout);
  
  // Parse results for summary
  if (stdout.includes('All specs passed!')) {
    console.log('\n🎉 All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
  }
});

console.log('⏳ Running tests... (this may take a few minutes)');
console.log('💡 Make sure your app is running on http://localhost:3000');
console.log('💡 Make sure your backend is running on http://localhost:8000'); 