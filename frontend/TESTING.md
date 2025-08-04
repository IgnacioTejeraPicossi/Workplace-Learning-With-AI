# Testing Documentation

## 🧪 Comprehensive Testing Suite

This application includes a comprehensive testing suite using Cypress for end-to-end testing of all features.

### 📋 Test Coverage

The testing suite covers:

#### **Sidebar Navigation Testing**
- ✅ All 11 sidebar options
- ✅ Panel loading verification
- ✅ Content presence checks
- ✅ Active state highlighting

#### **Feature Testing**
- ✅ Dashboard panel and content
- ✅ AI Concepts generation
- ✅ Micro-lessons creation
- ✅ Recommendation system
- ✅ Scenario simulations
- ✅ Web search functionality
- ✅ Team dynamics features
- ✅ Certification recommendations
- ✅ AI Career Coach
- ✅ Skills forecasting
- ✅ Saved lessons management

#### **UI/UX Testing**
- ✅ Global search functionality
- ✅ Theme toggle (light/dark mode)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Authentication flow verification

### 🚀 How to Run Tests

#### **Option 1: Using the "Run Test" Feature**
1. Start your application (`npm start`)
2. Navigate to the "Run Test" option in the sidebar (🧪)
3. Click "Run Cypress Tests" or "Run Manual Tests"
4. View results in the UI

#### **Option 2: Command Line**
```bash
# Navigate to frontend directory
cd frontend

# Run comprehensive tests
npm run test:comprehensive

# Or run the test script directly
node run-tests.js

# Or open Cypress UI
npm run cypress:open
```

#### **Option 3: Individual Test Files**
```bash
# Run specific test files
npx cypress run --spec "cypress/e2e/comprehensive-test.cy.js"
npx cypress run --spec "cypress/e2e/app.cy.js"
```

### 📊 Test Results

The test suite provides detailed results including:

- **Total tests run**: 11 sidebar options + additional features
- **Pass/Fail status**: Clear indication of test results
- **Execution time**: Performance metrics for each test
- **Screenshots**: Visual verification of each panel
- **Error details**: Specific failure information

### 🛠️ Test Structure

#### **Comprehensive Test File**: `cypress/e2e/comprehensive-test.cy.js`
- Tests all sidebar navigation options
- Verifies panel content loading
- Checks specific elements for each section
- Takes screenshots for visual verification
- Tests global search functionality
- Tests theme toggle
- Tests responsive design
- Tests authentication flow

#### **Individual Test Files**
- `app.cy.js` - Basic app functionality
- `appOption.cy.js` - App options testing
- `clearButtons.cy.js` - Clear button functionality
- `scenarioSimulator.cy.js` - Simulation testing
- `savedMicro-lessons.cy.js` - Saved lessons testing
- `webSearch.cy.js` - Web search functionality

### 🔧 Test Configuration

#### **Cypress Configuration**: `cypress.config.js`
```javascript
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true
  },
});
```

#### **Test Data Attributes**
The application includes `data-testid` attributes for reliable element selection:
- `sidebar-{section-id}` - Sidebar navigation buttons
- `global-search-modal` - Global search modal
- `search-results` - Search results container

### 📱 Visual Testing

The test suite includes visual verification:
- **Screenshots**: Each panel is captured for visual review
- **Responsive testing**: Tests on mobile, tablet, and desktop viewports
- **Theme testing**: Verifies light/dark mode functionality

### 🎯 Manual Testing

The "Run Test" feature also includes manual testing capabilities:
- **Quick verification**: Test all panels load correctly
- **Visual inspection**: Verify UI elements are present
- **Functional testing**: Test basic interactions

### 🔍 Debugging Tests

#### **Common Issues**
1. **App not running**: Ensure `npm start` is running on port 3000
2. **Backend not running**: Ensure backend is running on port 8000
3. **Authentication issues**: Tests handle unauthenticated state
4. **Timing issues**: Tests include appropriate waits for loading

#### **Debug Commands**
```bash
# Run tests with debug output
npx cypress run --spec "cypress/e2e/comprehensive-test.cy.js" --headed

# Open Cypress UI for debugging
npm run cypress:open

# Run specific test with video recording
npx cypress run --spec "cypress/e2e/comprehensive-test.cy.js" --record
```

### 📈 Continuous Integration

The test suite is designed for CI/CD integration:
- **Headless execution**: Runs without UI for automation
- **Exit codes**: Proper exit codes for CI systems
- **Video recording**: Optional video capture for debugging
- **Screenshot artifacts**: Visual verification artifacts

### 🚀 Future Enhancements

Planned testing improvements:
- **API testing**: Direct backend endpoint testing
- **Performance testing**: Load time and responsiveness metrics
- **Accessibility testing**: WCAG compliance verification
- **Cross-browser testing**: Chrome, Firefox, Safari support
- **Mobile testing**: Native mobile app testing

### 📞 Support

For testing issues or questions:
1. Check the Cypress documentation: https://docs.cypress.io
2. Review test logs in the Cypress UI
3. Check application console for errors
4. Verify all services are running (frontend, backend, database) 