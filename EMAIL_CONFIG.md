# 📧 Email Configuration Guide

## 🔧 Email Configuration for MongoDB Authentication

To receive verification emails in your real inbox (not just in the console), you need to configure the SMTP email service.

### 📋 Required Environment Variables

Add these variables to your `.env` file in the root directory:

```env
# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 🔐 Gmail Configuration (Recommended)

1. **Enable 2-Step Verification** in your Google account
2. **Generate an App Password**:
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

### 📝 Complete Configuration Example

```env
# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ignacio.tejera@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=ignacio.tejera@gmail.com

# JWT Configuration
JWT_SECRET=dev_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_change_in_production
ACCESS_TTL_MIN=15
REFRESH_TTL_DAYS=14

# Cookie Configuration
COOKIE_SECURE=false
APP_URL=http://localhost:3000
APP_NAME=AI Learning Platform
```

### 🚀 Activation Steps

1. **Create the `.env` file** in the root directory if it doesn't exist
2. **Add email variables** using your Gmail configuration
3. **Restart the backend** to load the new variables
4. **Test registration** - you should now receive real emails

### 🔄 Available Email Modes

- **`EMAIL_PROVIDER=dev`** (default): Only prints to console
- **`EMAIL_PROVIDER=smtp`**: Sends real emails via SMTP
- **`EMAIL_PROVIDER=sendgrid`**: Uses SendGrid (requires API key)

### ⚠️ Important Notes

- **Gmail requires app passwords** for SMTP
- **Don't use your normal Gmail password**
- **The `.env` file must be in the root directory** (not in `backend/`)
- **Restart the backend** after changing variables
