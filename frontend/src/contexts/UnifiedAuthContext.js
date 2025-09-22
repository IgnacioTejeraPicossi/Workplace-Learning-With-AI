// frontend/src/contexts/UnifiedAuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

// Firebase imports (existing)
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';

const UnifiedAuthContext = createContext();

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

export const UnifiedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authMethod, setAuthMethod] = useState(null); // 'firebase' or 'mongodb'
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  // Initialize auth state
  useEffect(() => {
    // Check for existing MongoDB auth token
    const mongoToken = localStorage.getItem('mongo_access_token');
    if (mongoToken) {
      setAccessToken(mongoToken);
      setAuthMethod('mongodb');
      // Verify token and get user profile
      verifyMongoToken(mongoToken);
    } else {
      // Listen for Firebase auth changes
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setAuthMethod('firebase');
        } else {
          setUser(null);
          setAuthMethod(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  const verifyMongoToken = async (token) => {
    try {
      const profile = await authApi.getProfile(token);
      setUser({
        uid: profile.id,
        email: profile.email,
        displayName: profile.email.split('@')[0],
        roles: profile.roles,
        isEmailVerified: profile.is_email_verified,
        mfaEnabled: profile.mfa_enabled
      });
      setLoading(false);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('mongo_access_token');
      setAccessToken(null);
      setUser(null);
      setAuthMethod(null);
      setLoading(false);
    }
  };

  // Firebase authentication methods
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setAuthMethod('firebase');
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // MongoDB authentication methods
  const signInWithMongoDB = async (token, userProfile) => {
    try {
      setAccessToken(token);
      setUser({
        uid: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.email.split('@')[0],
        roles: userProfile.roles,
        isEmailVerified: userProfile.is_email_verified,
        mfaEnabled: userProfile.mfa_enabled
      });
      setAuthMethod('mongodb');
      localStorage.setItem('mongo_access_token', token);
    } catch (error) {
      console.error('MongoDB sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (authMethod === 'firebase') {
        await signOut(auth);
      } else if (authMethod === 'mongodb') {
        await authApi.logout();
        localStorage.removeItem('mongo_access_token');
      }
      
      setUser(null);
      setAuthMethod(null);
      setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const refreshMongoToken = async () => {
    try {
      const result = await authApi.refresh();
      setAccessToken(result.access_token);
      localStorage.setItem('mongo_access_token', result.access_token);
      return result.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const getAuthHeaders = () => {
    if (authMethod === 'firebase' && user) {
      return user.getIdToken().then(token => ({
        'Authorization': `Bearer ${token}`
      }));
    } else if (authMethod === 'mongodb' && accessToken) {
      return Promise.resolve({
        'Authorization': `Bearer ${accessToken}`
      });
    }
    return Promise.resolve({});
  };

  const isAdmin = () => {
    if (!user) return false;
    if (authMethod === 'firebase') {
      // Firebase users are considered admins by default
      return true;
    } else if (authMethod === 'mongodb') {
      return user.roles && user.roles.includes('admin');
    }
    return false;
  };

  const isUser = () => {
    if (!user) return false;
    if (authMethod === 'firebase') {
      return true;
    } else if (authMethod === 'mongodb') {
      return user.roles && (user.roles.includes('user') || user.roles.includes('admin'));
    }
    return false;
  };

  const value = {
    // User state
    user,
    authMethod,
    loading,
    accessToken,
    
    // Authentication methods
    signInWithGoogle,
    signInWithMongoDB,
    logout,
    
    // Token management
    refreshMongoToken,
    getAuthHeaders,
    
    // Role checking
    isAdmin,
    isUser,
    
    // Utility
    isAuthenticated: !!user,
    isFirebaseAuth: authMethod === 'firebase',
    isMongoDBAuth: authMethod === 'mongodb'
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {!loading && children}
    </UnifiedAuthContext.Provider>
  );
};
