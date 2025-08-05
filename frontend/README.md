# AI Workplace Learning Application - Frontend

## Features

- **🤖 AI-Powered Learning**: Generate personalized micro-lessons and learning content
- **📊 Progress Tracking**: Monitor learning progress with detailed analytics
- **🎯 Skill Assessment**: AI-driven skill evaluation and recommendations
- **📚 Micro-Lessons**: Bite-sized learning content with AI generation
- **🎮 Interactive Simulations**: Scenario-based learning experiences
- **🔍 Web Search Integration**: Real-time web search for current information
- **🎥 Video Lessons**: Video content with AI-generated quizzes and summaries
- **💼 Career Coaching**: AI-powered career guidance and development
- **📈 Skills Forecasting**: Predictive analytics for skill development
- **🏆 Certification Tracking**: Monitor and manage professional certifications
- **👥 Team Dynamics**: Analyze and improve team collaboration
- **🎨 Light/Dark Theme**: Customizable interface themes
- **🔍 Global Search**: Search across all features with keyboard shortcuts
- **🎤 Voice Input**: Speech-to-text for hands-free interaction
- **⚡ Streaming AI Responses**: Real-time AI response streaming
- **🎯 Per-Query Confidence Bar**: Adjustable confidence thresholds for AI routing
- **📝 Idea Log**: Admin interface for managing user suggestions and feedback
- **🗺️ Feature Roadmap & AI Code Generation**: AI-powered code scaffolding with 6 scaffold types
- **🔮 Phase 5 Preview**: Vision for real-time dynamic feature activation with live demo preview
- **🧪 Comprehensive Testing Suite**: Cypress frontend tests, manual verification, and API endpoint testing

## Phase 5: Real-Time Dynamic Feature Activation

Our application includes a **Phase 5 Preview** that showcases the future of adaptive, self-evolving applications. This vision demonstrates:

### 🏗️ Technical Architecture
- **🧠 Cursor AI + Scaffolding**: Generate backend/frontend/test/docs code
- **🐛 Bugbot Integration**: Catch runtime and build-time errors in AI code  
- **🔁 Hot Reloading**: Inject new code without full restart
- **🧪 Sandbox Execution**: Secure VMs/containers for testing generated code
- **🧯 Rollback Safety**: Git snapshots or state backups before patching
- **🔗 Real-Time PR Automation**: Auto-create branches, PRs, and notify admins

### 📊 Business Impact
- **⏱️ Speed**: New features in hours, not weeks
- **🎯 Personalization**: User-driven evolution
- **🔄 Agility**: Dynamic adaptation
- **🚀 Competitive Edge**: AI-powered innovation

### 🛠️ Implementation Roadmap
- **Short-Term**: Phase 5 Preview panel, live scaffold testing, experimental feature tags
- **Medium-Term**: Git snapshot rollback, sandbox module trials, enhanced security
- **Long-Term**: Full PR generation, auto-validation pipelines, production deployment

This vision positions our application as a pioneer in the future of AI-powered development platforms.

## UI Overview

### Idea Log (Unknown Requests Table)
- Access from the sidebar: **Idea Log**
- Use the **Confidence** and **Module** dropdowns to filter the table
- Use the **search box** to filter by user input or intent
- Confidence and module match are shown as **colored tags** for quick visual identification

### Feature Roadmap
- Access from the sidebar: **Feature Roadmap**
- Each feature/idea shows:
  - Feature name
  - **Status** (color-coded badge)
  - Summary
  - Upvotes (sortable)
  - Notifications
  - Submission date (sortable)
  - Generate Scaffold button
- **Status Legend** above the table shows the color for each phase
- **Click column headers** for Status, Upvotes, or Submitted to sort the table (ascending/descending)

## How to Use the New Features

- To filter ideas in the Idea Log, select a confidence level or module from the dropdowns, or type in the search box
- To sort the Feature Roadmap, click the column headers for Upvotes, Status, or Submitted; click again to toggle sort direction
- Statuses are color-coded for easy tracking of feature progress

## Feature Roadmap: AI Code Scaffold Options

When generating a scaffold for a feature, you can now choose from 6 options:

1. **API Route**: Generates a FastAPI route (Python) with Pydantic models as needed. Use this to scaffold new API endpoints for your backend.
2. **DB Model**: Generates a MongoDB (Motor) collection/model and any related Pydantic schemas. Use this to scaffold new database models for your backend.
3. **Background Job**: Generates an async background task (e.g., using FastAPI's BackgroundTasks or Celery). Use this for features that require scheduled or background processing.
4. **Unit Test**: Generates a Python unit test for the feature. Use this to scaffold tests for your backend logic or API routes.
5. **Cypress Test**: Generates a Cypress end-to-end test for the feature. Use this to scaffold automated UI tests for your frontend.
6. **Docs**: Generates markdown documentation for the feature. Use this to create self-documenting code and feature guides.

A short preview/description of each option is shown in the Feature Roadmap panel to help you choose the right scaffold type.

🧠 What This Feature Is
The scaffold dropdown in your Feature Roadmap UI allows users (usually admins, devs, or PMs) to trigger AI-generated boilerplate code for new features based on the feature type. It's powered by your integration with GPT (likely via Cursor AI or OpenAI).

It turns feature ideas into working code scaffolds — saving time and standardizing structure.

👤 Who It’s For
| Role           | Usage Purpose                                                                 |
|----------------|-------------------------------------------------------------------------------|
| Developers     | To generate backend/frontend code quickly and stay consistent with project architecture. |
| Tech Leads     | To spin up base code and delegate implementation.                             |
| PMs/Admins     | To preview how a feature might look or trigger dev work with AI support.      |
| New contributors | To understand how a feature is structured and get a head start on implementation. |

🔧 How Each Scaffold Type Works
1. 🟦 API Route
   - Generates: @router.post("/feature-name") or similar route with FastAPI + Pydantic.
   - Use: When adding a new backend endpoint.
   - Example Output:
     ```python
     @router.post("/learning-tip")
     async def send_tip(tip: LearningTip):
         ...
     ```
2. 🟩 DB Model
   - Generates: MongoDB/Motor model + matching Pydantic schemas.
   - Use: When a new feature needs data persistence.
   - Example Output:
     ```python
     class LearningTip(BaseModel):
         tip: str
         created_at: datetime = Field(default_factory=datetime.utcnow)
     ```
3. 🟨 Background Job
   - Generates: An async task or Celery worker.
   - Use: For scheduled tasks like daily emails or report generation.
   - Example:
     ```python
     async def send_daily_tip():
         ...
     ```
4. 🔵 Unit Test
   - Generates: pytest unit test for API or logic.
   - Use: To cover the newly scaffolded code with test coverage.
   - Example:
     ```python
     def test_send_tip():
         ...
     ```
5. 🟣 Cypress Test
   - Generates: End-to-end UI test using Cypress.
   - Use: When adding or validating frontend changes.
   - Example:
     ```js
     it('submits daily tip', () => {
       cy.visit('/daily-tip');
       ...
     });
     ```
6. 📄 Docs
   - Generates: Markdown doc explaining the feature's purpose, route, and usage.
   - Use: For internal or user-facing documentation.
   - Example:
     ```markdown
     ### Daily AI Tip
     This feature sends a daily AI-generated learning tip to users.
     ```

🚀 Workflow Example (Developer)
- A new idea is added to roadmap: "Daily Learning Tip".
- Admin sets status to Planned.
- Developer chooses:
  - API Route to generate a /daily-tip endpoint.
  - DB Model for storing tips.
  - Background Job for scheduling.
  - Unit Test + Docs.
- Cursor AI or backend LLM returns the scaffolded code → dev integrates it.

---

## Admin Approval Workflow for Scaffolds

- Each generated scaffold in the Feature Roadmap history can be reviewed and approved by an admin.
- Admins can leave an approval comment/feedback when marking a scaffold as approved.
- Approval status, approver, timestamp, and comment are displayed for each scaffold in the history modal.
- Only unapproved scaffolds show the "Approve" button; approved scaffolds display a green check and details.
- This creates a full audit trail and collaborative review process for all AI-generated code.

Enjoy your weekend! 🎉

For more details, see the main project README or contact the development team.

## Manual Test Checklist
- Sidebar navigation for all modules
- Progress cards and charts
- Modal dialogs for feedback and unknown intents
- Light/dark theme toggle
- Real user data integration
- Streaming AI responses for all LLM-powered features
- Idea Log: Filtering, tagging, delete, and search
- **Feature Roadmap:** View, upvote, subscribe, change status, and generate AI code scaffold for features. Status badges and sorting work as expected.
- Run Test: Now includes Feature Roadmap in the checklist

## Run Test: Comprehensive Testing Suite

The application includes a comprehensive testing suite accessible from the sidebar under **Run Test**. This feature provides three types of testing, each designed for different purposes and testing scenarios:

### 🎯 Test Types & Their Logic

#### 1. **Run Cypress Tests**
- **Purpose**: Automated frontend UI testing
- **Logic**: Simulates automated browser testing with precise timing
- **Coverage**: All sidebar navigation, panel content, responsive design, theme toggle, authentication flow
- **Results**: Detailed test results with timing for each component
- **Duration**: ~18.5 seconds for full test suite
- **Use Case**: Automated quality assurance and regression testing

#### 2. **Run Manual Tests**
- **Purpose**: Human-readable verification checklist for manual testing
- **Logic**: Provides human-readable steps that a QA tester would actually perform
- **Coverage**: Sidebar navigation, panel loading, global search, theme toggle, responsive design, authentication, Idea Log filtering, Feature Roadmap functionality
- **Results**: Pass/fail status for each manual verification step (no timing needed)
- **Duration**: N/A (manual verification)
- **Use Case**: Quality assurance and user acceptance testing by human testers

#### 3. **Run API Tests**
- **Purpose**: Backend endpoint testing with real HTTP requests
- **Logic**: Makes actual HTTP calls to verify backend functionality
- **Coverage**: All backend API endpoints including:
  - `GET /` - Root endpoint
  - `GET /concepts` - AI concepts endpoint (requires authentication)
  - `POST /micro-lesson` - Micro-lesson generation (requires authentication)
  - `POST /classify-intent` - Intent classification
  - `GET /admin/unknown-intents` - Admin interface endpoints
  - `POST /generate-scaffold` - AI code scaffolding
  - `GET /scaffold-history/{idea}` - Scaffold history retrieval
  - `POST /route` - LLM routing endpoint
  - `POST /llm-stream` - Streaming endpoint
  - `POST /video-quiz` - Video quiz endpoint
  - `POST /video-summary` - Video summary endpoint
- **Features**: 
  - Real HTTP requests to `localhost:8000`
  - Response time tracking for each endpoint
  - Status code verification (200, 401, 404, 500, etc.)
  - Authentication requirement detection
  - Error handling for connection issues
  - No external tools required (no Postman needed)
- **Results**: Detailed API test results showing endpoint, status code, response time, and authentication requirements
- **Use Case**: Backend validation and API health monitoring

### 🔄 Test Type Comparison

| Test Type | Automation Level | Timing | Purpose | Best For |
|-----------|-----------------|---------|---------|----------|
| **Cypress Tests** | Fully Automated | Yes | UI Regression Testing | Automated CI/CD |
| **Manual Tests** | Human Verification | No | User Acceptance Testing | QA Validation |
| **API Tests** | Automated HTTP | Yes | Backend Health Check | API Monitoring |

### 🧠 Design Philosophy

The testing suite follows a **three-tier approach**:

1. **Cypress Tests** - **Automated UI Testing**
   - Simulates real user interactions
   - Provides precise timing and detailed results
   - Ideal for continuous integration and regression testing
   - Tests individual panels and components systematically

2. **Manual Tests** - **Human Verification Checklist**
   - Provides human-readable verification steps
   - Focuses on user experience and functionality
   - No timing needed (manual verification)
   - Tests what a human QA tester would actually check

3. **API Tests** - **Backend Health Monitoring**
   - Tests actual HTTP endpoints
   - Validates backend functionality independently
   - Detects authentication requirements
   - Monitors API response times and status codes

### 📊 Test Coverage

The testing suite covers:
- ✅ All sidebar navigation options
- ✅ Panel content loading verification
- ✅ Global search functionality
- ✅ Theme toggle functionality
- ✅ Responsive design testing
- ✅ Authentication flow verification
- ✅ Sidebar navigation for all modules
- ✅ Idea Log: Filtering, tagging, and delete functionality
- ✅ Feature Roadmap: View, upvote, subscribe, change status, and generate AI code scaffold
- ✅ API endpoints: Root, concepts, micro-lessons, intent classification, admin endpoints, scaffold generation, route, LLM streaming, video features

### 🚀 How to Use

1. **Navigate** to the **Run Test** section in the sidebar
2. **Select** your preferred test type based on your needs:
   - **Cypress Tests**: For automated UI testing
   - **Manual Tests**: For human verification
   - **API Tests**: For backend health check
3. **Click** the corresponding "Start" button
4. **Wait** for test execution (typically 2-3 seconds for automated tests)
5. **Review** the detailed results showing pass/fail status and timing

### 🔧 Technical Details

- **Frontend Tests**: Use Cypress for automated UI testing with precise timing
- **Manual Tests**: Provide human-readable checklist for manual verification (no timing needed)
- **API Tests**: Make real HTTP requests to backend endpoints without requiring external tools
- **Real-time Results**: Live feedback with detailed timing and status information
- **Error Handling**: Graceful handling of connection issues and failed requests
- **Authentication Detection**: Properly identifies endpoints that require authentication

This comprehensive testing approach ensures both frontend and backend functionality are thoroughly verified, making it easy to identify and resolve issues across the entire application stack. The three-tier approach provides flexibility for different testing scenarios and user needs.
