import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

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
    await signOut(auth);
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <>
          <div>Welcome, {user.displayName}!</div>
          <sl-button variant="default" onClick={handleSignOut}>Sign Out</sl-button>
        </>
      ) : (
        <sl-button variant="primary" onClick={handleSignIn}>Sign in with Google</sl-button>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
