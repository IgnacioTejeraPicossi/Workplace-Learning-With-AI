import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import AuthSelector from './components/Auth/AuthSelector';

export default function Auth({ user, setUser }) {
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    // Clear MongoDB token if it exists
    localStorage.removeItem('mongodb_access_token');
    
    // Sign out from Firebase
    await signOut(auth);
    setUser(null);
  };

  // Si no hay usuario, mostrar el selector de autenticación
  if (!user) {
    return <AuthSelector onGoogleSignIn={setUser} />;
  }

  // Si hay usuario, mostrar el botón de logout
  return (
    <div>
      <div>Welcome, {user.displayName}!</div>
      <sl-button variant="default" onClick={handleSignOut}>Sign Out</sl-button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
