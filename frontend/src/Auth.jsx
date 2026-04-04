import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import AuthSelector from './components/Auth/AuthSelector';

export default function Auth({ user, setUser }) {
  const { t } = useTranslation();
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
  const displayName = user.displayName || user.email?.split('@')[0] || '—';

  return (
    <div>
      <div>{t('auth.greeting', { name: displayName })}</div>
      <sl-button variant="default" onClick={handleSignOut}>{t('actions.signOut')}</sl-button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
