// apps/web/src/app/login/page.tsx
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import InputField from '../../components/InputField';
import FormContainer from '../../components/FormContainer';
import { setToken } from '../../utils/auth';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    
    // Check for error parameters in URL
    const expired = searchParams?.get('expired');
    const invalid = searchParams?.get('invalid');

    if (expired) {
      setError('Your session has expired. Please log in again.');
    } else if (invalid) {
      setError('Invalid authentication. Please log in again.');
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
  
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }
  
      if (!data.success || !data.data?.token) {
        setError('Invalid response from server');
        setIsLoading(false);
        return;
      }

      // Store token
      setToken(data.data.token);

      // Get redirect path from URL or default to topic
      const redirectPath = searchParams?.get('redirect') || '/topics';
      
      // Redirect to the requested page
      router.push(redirectPath);
  
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Show loading screen if not mounted
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-teal-600 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          font-family: sans-serif;
        }
      `}</style>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="absolute top-0 left-0 w-full h-32 bg-teal-500 rounded-b-[40%]"></div>
        
        <div className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Left side content (desktop only) */}
          <div className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0">
            <Header title="Welcome Back" />
            <div className="mt-6 text-gray-600">
              <h2 className="text-2xl font-bold text-teal-700 mb-4">Continue Your English Journey</h2>
              <p className="mb-3">Log in to access your personalized advocacy English learning materials.</p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Access your custom learning path</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Track your progress and achievements</span>
                </div>
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-teal-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Connect with mentors and fellow learners</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side form */}
          <div className="lg:w-1/2">
            <div className="block lg:hidden text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
              <div className="mt-2 w-16 h-1 bg-teal-500 mx-auto rounded-full"></div>
            </div>
            
            <FormContainer>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 shadow-md">
                    <div className="flex">
                      <div className="py-1">
                        <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                      Forgot your password?
                    </a>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-teal-600 text-white font-medium rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </div>
                    ) : 'Login'}
                  </button>
                </div>
                
                <div className="text-center text-sm text-gray-600 mt-4">
                  Don't have an account? <a href="/signup" className="font-medium text-teal-600 hover:text-teal-500">Sign up</a>
                </div>
              </form>
            </FormContainer>
          </div>
        </div>
      </div>
    </>
  );
}