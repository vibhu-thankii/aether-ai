'use client';

import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AlertTriangle, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';

// --- Google SVG Icon ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.297-11.297-7.915l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,36.621,44,30.637,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);


// --- Helper: Conditional Class Names ---
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const auth = getAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && !agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, the main app's onAuthStateChanged will handle the rest.
    } catch (err: any) {
      // Firebase provides user-friendly error messages, we can use them directly.
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // On success, the main app's onAuthStateChanged will handle the rest.
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };
  
  const isFormValid = !isLogin ? email && password.length >= 6 && agreeToTerms : email && password;

  return (
    <div className="w-full h-screen bg-[#020617] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Aether AI</h1>
          <p className="text-white/60 mt-2">{isLogin ? 'Welcome back' : 'Create an account to begin'}</p>
        </div>
        
        {/* Social Login */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors mb-4"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        
        {/* Separator */}
        <div className="flex items-center my-4">
          <hr className="w-full border-white/20"/>
          <span className="px-2 text-xs text-white/40">OR</span>
          <hr className="w-full border-white/20"/>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Terms and Conditions for Sign Up */}
          {!isLogin && (
             <div className="flex items-start space-x-3 pt-2">
                <input
                    id="terms"
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="h-4 w-4 mt-1 bg-white/10 border-white/30 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="terms" className="text-sm text-white/60">
                    I agree to the{' '}
                    <Link href="/terms-of-service" target="_blank" className="underline hover:text-indigo-400">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" target="_blank" className="underline hover:text-indigo-400">
                        Privacy Policy
                    </Link>.
                </label>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isLogin && !isFormValid}
            className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-3 rounded-lg transition-all disabled:bg-indigo-800/50 disabled:cursor-not-allowed"
          >
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-white/60 hover:text-white">
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}