// frontend/src/components/Auth/AuthSelector.jsx
import React, { useState } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import MongoAuth from './MongoAuth';
import './AuthSelector.css';

const AuthSelector = ({ onGoogleSignIn }) => {
  const [authMethod, setAuthMethod] = useState(null); // 'firebase' or 'mongodb'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (onGoogleSignIn) {
        onGoogleSignIn(result.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMongoDBAuth = (token, user) => {
    // Store MongoDB JWT token in localStorage for API calls
    localStorage.setItem('mongodb_access_token', token);
    
    // Convert MongoDB user to Firebase-like user format for compatibility
    const firebaseLikeUser = {
      uid: user.id,
      email: user.email,
      displayName: user.email.split('@')[0], // Use email prefix as display name
      photoURL: null,
      // Add MongoDB-specific data
      roles: user.roles,
      isEmailVerified: user.is_email_verified,
      mfaEnabled: user.mfa_enabled,
      authMethod: 'mongodb',
      accessToken: token
    };
    
    console.log('MongoDB auth successful:', firebaseLikeUser);
    
    // Call the same callback as Google sign-in to maintain compatibility
    if (onGoogleSignIn) {
      onGoogleSignIn(firebaseLikeUser);
    }
  };

  if (authMethod === 'mongodb') {
    return (
      <MongoAuth 
        onLoggedIn={handleMongoDBAuth}
        onRegisterSuccess={() => setAuthMethod(null)}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Choose Authentication Method
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            Select how you'd like to sign in to AI Learning Platform
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Authentication Options - Horizontal Layout */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* MongoDB Authentication - Left Side */}
          <div style={{
            flex: 1,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: '#dcfce7',
                borderRadius: '50%',
                marginBottom: '0.75rem'
              }}>
                <svg style={{ width: '16px', height: '16px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Email & Password
              </h3>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '1rem'
              }}>
                Create account with email, includes MFA support
              </p>
              <button
                onClick={() => setAuthMethod('mongodb')}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign in with Email</span>
              </button>
            </div>
          </div>

          {/* Google Authentication - Right Side */}
          <div style={{
            flex: 1,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                marginBottom: '0.75rem'
              }}>
                <svg style={{ width: '16px', height: '16px', color: '#2563eb' }} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Sign in with Google
              </h3>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '1rem'
              }}>
                Quick and secure authentication
              </p>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <svg style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features Comparison */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '0.5rem'
        }}>
          <h4 style={{
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '0.75rem'
          }}>
            Authentication Features
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            fontSize: '0.625rem',
            color: '#6b7280'
          }}>
            <div>
              <div style={{
                fontWeight: '500',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Google Sign-in
              </div>
              <ul style={{ margin: 0, paddingLeft: '0.5rem' }}>
                <li>• Quick setup</li>
                <li>• Secure OAuth</li>
                <li>• No password needed</li>
                <li>• Admin access</li>
              </ul>
            </div>
            <div>
              <div style={{
                fontWeight: '500',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                Email & Password
              </div>
              <ul style={{ margin: 0, paddingLeft: '0.5rem' }}>
                <li>• Full control</li>
                <li>• MFA support</li>
                <li>• Role management</li>
                <li>• Email verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSelector;
