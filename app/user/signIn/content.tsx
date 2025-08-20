"use client";
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import CloseIcon from '@/components/CloseIcon';
import { useUserContext } from '@/app/lib/context/UserContext';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import Link from 'next/link'; // Added for navigation

const SignInContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const { loginWithEmail, loginWithGoogle, loginWithFacebook, user_loading, error_user, user } = useUserContext();

  useEffect(() => {
    if (user && !user_loading) {
      router.push('/'); // Redirect if already logged in
    }
  }, [user, user_loading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFormError('Email and password cannot be empty.');
      return;
    }
    setFormError('');
    const firebaseUser = await loginWithEmail(email, password);
    if (firebaseUser) {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    const firebaseUser = await loginWithGoogle();
    if (firebaseUser) {
      router.push('/');
    }
  };

  const handleFacebookLogin = async () => {
    const firebaseUser = await loginWithFacebook();
    if (firebaseUser) {
      router.push('/');
    }
  };

  if (user_loading && !user) { // Show loading only if user is not yet available
    return (
      <div className="flex min-h-screen items-center justify-center bg-color-primary">
        <p className="text-color-primary">Loading...</p>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen bg-color-primary text-color-primary font-sans items-center justify-center">
      {/* Main Content Panel */}
      <div className="w-full max-w-md p-8 sm:p-12 md:p-16 flex flex-col justify-center">
      
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8 justify-center">
            {/* <CloseIcon /> You might want to remove or reposition this for a login page */}
            <h1 className="text-2xl sm:text-3xl font-semibold">Sign In to Oryza</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="mb-8">
            <h2 className="text-xl sm:text-2xl font-medium mb-6 text-center">
              Welcome back!
            </h2>

            <div className="mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full bg-transparent border-b border-color-light py-3 text-lg placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full bg-transparent border-b border-color-light py-3 text-lg placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
              />
            </div>
            {formError && <p className="text-xs sm:text-sm text-red-500 mb-4 text-center">{formError}</p>}
            
            <button 
              type="submit"
              className="w-full flex items-center justify-center bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-6 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
            >
              Sign In
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-4 mb-8">
            <p className="text-sm text-color-muted text-center">Or sign in with</p>
            <button
              onClick={handleGoogleLogin}
              disabled={user_loading}
              className="w-full flex items-center justify-center bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-6 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
            >
              <FcGoogle className="mr-3 text-xl" />
              Sign in with Google
            </button>
            <button
              onClick={handleFacebookLogin}
              disabled={user_loading}
              className="w-full flex items-center justify-center bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-6 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
            >
              <FaFacebook className="mr-3 text-xl text-[#1877F2]" />
              Sign in with Facebook
            </button>
          </div>
          
          {user_loading && !error_user && <p className="text-sm text-color-muted mt-4 text-center">Processing...</p>}
          {error_user && <p className="text-sm text-red-500 mt-4 text-center">{error_user}</p>}

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-sm text-color-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/user/new" className="font-semibold text-color-link hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
};

export default SignInContent;
