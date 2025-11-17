import React, { useState } from 'react';
import Icon from '../components/Icon';
import DotGrid from '../components/DotGrid';
import { auth } from '../firebase'; // <-- must be modular auth from firebase v9+
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { AlertType, AccentColor, Theme } from '../types';
import ScrambledText from '../components/ScrambledText';

interface LoginProps {
  addAlert: (message: string, type: AlertType) => void;
  accentColor: AccentColor | null;
  theme: Theme;
}

// Map Firebase error codes to friendly messages
const getFirebaseErrorMessage = (errorCode?: string, fallback?: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Popup request cancelled. Try again.';
    default:
      return fallback || 'An unexpected error occurred. Please try again.';
  }
};

const AuthForm: React.FC<{
  isLoginView: boolean;
  isLoading: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}> = ({
  isLoginView,
  isLoading,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  handleSubmit,
}) => {
  const commonInputClasses =
    'mt-1 w-full p-3 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none bg-light-surface/50 dark:bg-black/30 text-light-text dark:text-white placeholder-gray-400 transition-all';
  const commonLabelClasses =
    'text-sm font-medium text-light-text-secondary dark:text-gray-300';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {!isLoginView && (
        <div>
          <label className={commonLabelClasses}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={commonInputClasses}
            required
          />
        </div>
      )}
      <div>
        <label className={commonLabelClasses}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={commonInputClasses}
          required
        />
      </div>
      <div>
        <label className={commonLabelClasses}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={commonInputClasses}
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full py-3 bg-brand-primary text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 
        disabled:bg-slate-600 dark:disabled:bg-slate-700 
        hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading
          ? isLoginView
            ? 'Logging in...'
            : 'Creating Account...'
          : isLoginView
          ? 'Login'
          : 'Sign Up'}
      </button>
    </form>
  );
};

const Login: React.FC<LoginProps> = ({ addAlert, accentColor, theme }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // DotGrid colors from accent
  const lightActiveColor = accentColor?.main || '#3b82f6';
  const darkActiveColor = accentColor?.main || '#f038d1';

  // Helper to surface friendly message and console debug
  const handleError = (err: any) => {
    // Firebase Error object usually has code + message
    const code = err?.code;
    const msg = err?.message || String(err);
    console.error('Auth error:', { code, msg, raw: err });
    const friendly = getFirebaseErrorMessage(code, msg);
    addAlert(friendly, 'error');
  };

  // Email/password handlers (modular API)
  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // update display name if provided
        if (userCred.user) {
          if (fullName && typeof updateProfile === 'function') {
            // updateProfile accepts (user, {displayName})
            await updateProfile(userCred.user as User, { displayName: fullName });
          }
        }
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-in (modular API)
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const titleStyle: React.CSSProperties = {
    color: accentColor?.main || 'var(--color-primary)',
    textShadow: `0 0 30px ${accentColor?.glow || 'var(--color-primary-glow)'}`,
  };

  const OrSeparator = () => (
    <div className="flex items-center my-4">
      <hr className="flex-grow border-light-border dark:border-dark-border" />
      <span className="mx-4 text-xs text-light-text-secondary dark:text-dark-text-secondary">OR</span>
      <hr className="flex-grow border-light-border dark:border-dark-border" />
    </div>
  );

  return (
    <div className="min-h-screen bg-light-background dark:bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Light DotGrid */}
      <div className="absolute inset-0 dark:hidden z-0">
        <DotGrid
          dotSize={3}
          gap={30}
          baseColor="#d1d5db"
          activeColor={lightActiveColor}
          proximity={120}
          shockStrength={3}
          className="w-full h-full"
        />
      </div>

      {/* Dark DotGrid */}
      <div className="absolute inset-0 hidden dark:block z-0">
        <DotGrid
          dotSize={3}
          gap={30}
          baseColor="#392e4e"
          activeColor={darkActiveColor}
          proximity={120}
          shockStrength={3}
          className="w-full h-full"
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm z-10 group animate-float">
        <div className="text-center mb-6">
          <ScrambledText className="!text-4xl !font-bold !m-0 text-center" radius={20} style={titleStyle}>
            SENTILYTICS
          </ScrambledText>
          <p className="text-light-text-secondary dark:text-gray-400 mt-2">Welcome back</p>
        </div>

        <div className="p-8 rounded-2xl bg-light-surface/30 dark:bg-black/30 border border-light-border dark:border-dark-border shadow-inner transition-all duration-300 group-hover:backdrop-blur-md group-hover:shadow-glow-primary">
          <AuthForm
            isLoginView={isLoginView}
            isLoading={isLoading}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            fullName={fullName}
            setFullName={setFullName}
            handleSubmit={handleEmailPasswordAuth}
          />

          <OrSeparator />

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 bg-white dark:bg-slate-800 border border-light-border dark:border-dark-border rounded-lg flex items-center justify-center gap-3 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <Icon type="brands" name="google" />
            Sign in with Google
          </button>

          <p className="text-center text-sm text-light-text-secondary dark:text-gray-400 mt-6">
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-brand-primary hover:underline">
              {isLoginView ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
