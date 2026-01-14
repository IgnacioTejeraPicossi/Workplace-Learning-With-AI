# 🔐 MongoDB Authentication Setup Guide

## 📋 Overview

This guide explains how to set up and use the dual authentication system in the AI Learning Platform. The system supports both **Firebase/Google authentication** and **MongoDB email+password authentication** with MFA support.

## 🏗️ Architecture

### Dual Authentication System
- **Firebase Auth**: Quick Google sign-in (existing)
- **MongoDB Auth**: Email+password with MFA, roles, and full control

### Backend Components
- `backend/models/user.py` - User data models
- `backend/core/security.py` - JWT and password security
- `backend/core/email.py` - Email service abstraction
- `backend/routers/auth.py` - Authentication endpoints
- `backend/core/deps.py` - Authentication dependencies

### Frontend Components
- `frontend/src/contexts/UnifiedAuthContext.js` - Unified auth state
- `frontend/src/components/Auth/AuthSelector.jsx` - Auth method selection
- `frontend/src/components/Auth/MongoAuth.jsx` - MongoDB auth forms
- `frontend/src/api/authApi.js` - MongoDB auth API calls
- `frontend/src/api/apiInterceptor.js` - Automatic token refresh

## 🔧 Configuration

### 1. Environment Variables (.env)

Add these variables to your `.env` file:

```env
# MongoDB Authentication Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
ACCESS_TTL_MIN=15
REFRESH_TTL_DAYS=14
APP_URL=http://localhost:3000
APP_NAME=AI Learning Platform
COOKIE_SECURE=false

# Email Configuration
EMAIL_PROVIDER=dev
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=your-email@domain.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 2. Email Provider Options

#### Development (Default)
```env
EMAIL_PROVIDER=dev
```
- Emails are printed to console
- Perfect for development and testing

#### SMTP
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
SMTP_FROM=your-email@domain.com
```

#### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=your-email@domain.com
```

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
# Backend dependencies (already added to requirements.txt)
pip install argon2-cffi==23.1.0 pyjwt==2.9.0 pyotp==2.9.0 qrcode==7.4.2

# Frontend dependencies
npm install
```

### 2. Database Setup

The system will automatically create the required MongoDB collections and indexes:

```javascript
// Users collection structure
{
  _id: ObjectId,
  email: String (unique, indexed),
  password_hash: String,
  is_email_verified: Boolean,
  roles: Array<String>,
  mfa: {
    enabled: Boolean,
    type: String, // "totp" or null
    secret: String,
    phone_e164: String
  },
  refresh_token_hash: String,
  refresh_token_exp: Number,
  refresh_jti: String,
  created_at: Date,
  updated_at: Date
}
```

### 3. Start Services

```bash
# Backend
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm start
```

## 🔐 Authentication Flows

### MongoDB Authentication

#### 1. Registration
```
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "user" // or "admin"
}
```

#### 2. Login
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### 3. MFA Setup (Optional)
```
POST /auth/mfa/setup
Authorization: Bearer <access_token>
```

#### 4. MFA Verification
```
POST /auth/mfa/verify
{
  "challenge_id": "user_id",
  "code": "123456"
}
```

#### 5. Token Refresh
```
POST /auth/refresh
Cookie: refresh_token=<refresh_token>
```

### Firebase Authentication (Existing)

The existing Firebase authentication continues to work unchanged.

## 🎛️ Frontend Integration

### 1. Update App.jsx

```javascript
import { UnifiedAuthProvider } from './contexts/UnifiedAuthContext';
import AuthSelector from './components/Auth/AuthSelector';

function App() {
  const { isAuthenticated } = useUnifiedAuth();

  if (!isAuthenticated) {
    return <AuthSelector />;
  }

  return (
    // Your existing app content
  );
}

export default function AppWrapper() {
  return (
    <UnifiedAuthProvider>
      <App />
    </UnifiedAuthProvider>
  );
}
```

### 2. Using Authentication in Components

```javascript
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

function MyComponent() {
  const { 
    user, 
    authMethod, 
    isAdmin, 
    isUser,
    logout 
  } = useUnifiedAuth();

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <p>Auth method: {authMethod}</p>
      <p>Is admin: {isAdmin() ? 'Yes' : 'No'}</p>
      
      {isAdmin() && (
        <AdminPanel />
      )}
      
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Making API Calls

```javascript
import { api, setAccessToken } from '../api/apiInterceptor';

// The interceptor automatically handles token refresh
const data = await api.get('/api/protected-endpoint');
const result = await api.post('/api/data', { key: 'value' });
```

## 🔒 Security Features

### Password Security
- **Argon2** password hashing (industry standard)
- Configurable hash parameters
- Protection against timing attacks

### JWT Security
- **Short-lived access tokens** (15 minutes default)
- **Long-lived refresh tokens** (14 days default)
- **Token rotation** on refresh
- **HttpOnly cookies** for refresh tokens
- **Secure cookie settings** for production

### MFA Support
- **TOTP** (Time-based One-Time Password)
- **QR code generation** for authenticator apps
- **Google Authenticator** compatible
- **Microsoft Authenticator** compatible

### Email Security
- **Email verification** required
- **Password reset** with secure tokens
- **Rate limiting** protection
- **User enumeration** protection

## 🎯 Role-Based Access Control

### User Roles
- **`user`**: Standard user access
- **`admin`**: Administrative access

### Role Checking
```javascript
// Backend (FastAPI)
from backend.core.deps import require_admin, require_user

@router.get("/admin-only")
async def admin_endpoint(user = Depends(require_admin)):
    return {"message": "Admin only content"}

@router.get("/user-content")
async def user_endpoint(user = Depends(require_user)):
    return {"message": "User content"}
```

```javascript
// Frontend (React)
const { isAdmin, isUser } = useUnifiedAuth();

{isAdmin() && <AdminPanel />}
{isUser() && <UserContent />}
```

## 📧 Email Templates

The system includes professional email templates for:

- **Email verification**
- **Password reset**
- **Welcome messages**

Templates support both HTML and plain text formats.

## 🐳 Docker Support

### docker-compose.yml
```yaml
version: "3.9"
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    environment:
      MONGO_URI: "mongodb://mongo:27017/ai_learning"
      JWT_SECRET: "your_jwt_secret"
      JWT_REFRESH_SECRET: "your_refresh_secret"
      EMAIL_PROVIDER: "smtp"
      SMTP_HOST: "smtp.office365.com"
      SMTP_PORT: "587"
      SMTP_USER: "your-email@domain.com"
      SMTP_PASS: "your-password"
    depends_on:
      - mongo
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    environment:
      REACT_APP_API_BASE_URL: "http://localhost:8000"
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mongo_data:
```

## 🔍 API Endpoints

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - User profile

### MFA Endpoints
- `POST /auth/mfa/setup` - Setup MFA
- `POST /auth/mfa/verify` - Verify MFA code

### Email Endpoints
- `POST /auth/verify-email/request` - Request email verification
- `POST /auth/verify-email/confirm` - Confirm email verification
- `POST /auth/password/forgot` - Request password reset
- `POST /auth/password/reset` - Reset password

## 🚨 Troubleshooting

### Common Issues

#### 1. "Token verification failed"
- Check JWT_SECRET and JWT_REFRESH_SECRET are set
- Verify tokens haven't expired
- Check MongoDB connection

#### 2. "Email sending failed"
- Verify EMAIL_PROVIDER configuration
- Check SMTP credentials
- Test with EMAIL_PROVIDER=dev first

#### 3. "MFA setup failed"
- Ensure pyotp and qrcode are installed
- Check user permissions
- Verify TOTP secret generation

#### 4. "CORS errors"
- Check CORS configuration in FastAPI
- Verify frontend URL in APP_URL
- Ensure credentials: 'include' in fetch calls

### Debug Mode

Set these environment variables for debugging:
```env
COOKIE_SECURE=false
EMAIL_PROVIDER=dev
```

## 📚 Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Argon2 Documentation](https://github.com/P-H-C/phc-winner-argon2)
- [TOTP RFC](https://tools.ietf.org/html/rfc6238)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

## 🎉 Benefits

### For Users
- **Choice**: Google sign-in or email+password
- **Security**: MFA support for sensitive accounts
- **Control**: Full account management
- **Privacy**: Option for self-hosted authentication

### For Developers
- **Flexibility**: Dual authentication systems
- **Security**: Industry-standard practices
- **Scalability**: Role-based access control
- **Maintainability**: Clean, modular code

### For Organizations
- **Compliance**: Full control over user data
- **Integration**: Easy integration with existing systems
- **Customization**: Customizable email templates and flows
- **Monitoring**: Complete audit trail of authentication events
