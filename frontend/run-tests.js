#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Starting Comprehensive App Tests...');
console.log('=' .repeat(50));

console.log('📋 Test Coverage Includes:');
console.log('✅ Core Application Tests');
console.log('✅ Babel Library & Navigation Intelligence');
console.log('✅ ItemAI API (Local LM Studio Integration)');
console.log('✅ MongoDB Integration (All Modules)');
console.log('✅ Skills Forecast Module');
console.log('✅ Enhanced CRUD Operations');
console.log('✅ Cross-Module Communication');
console.log('✅ Knowledge Map Dynamic Generation');
console.log('✅ API Endpoint Verification');

console.log('\n🚀 Running Comprehensive Tests...');
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
    console.log('✅ Application is fully functional with all new features');
    console.log('✅ Babel Library navigation intelligence working');
    console.log('✅ ItemAI API integration successful');
    console.log('✅ MongoDB operations functioning correctly');
    console.log('✅ Cross-module communication established');
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    console.log('🔍 Focus on failed test areas for debugging');
  }
});

console.log('⏳ Running tests... (this may take a few minutes)');
console.log('💡 Make sure your app is running on http://localhost:3000');
console.log('💡 Make sure your backend is running on http://localhost:8000');
console.log('💡 Make sure MongoDB is running and accessible');
console.log('💡 Make sure LM Studio is running on http://localhost:1234 (for ItemAI tests)'); 