//apps/web/src/components/Login.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFailure, setShowFailure] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowFailure(false);

    console.log('Login attempt started:', { email });

    try {
      console.log('Sending login request to /api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Login failed:', data);
        setError(data.error || 'Login failed');
        setShowFailure(true);
        return;
      }

      // Login successful
      console.log('Login successful, storing token and redirecting');
      if (data.token) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        console.log('Token stored in localStorage');

        // Force a hard navigation to ensure the page reloads
        console.log('Forcing navigation to /topic');
        window.location.replace('/topic');
      } else {
        console.error('No token received in response');
        setError('Login successful but no token received');
        setShowFailure(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      setError('An error occurred while trying to log in');
      setShowFailure(true);
    } finally {
      console.log('Login attempt completed, resetting loading state');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className={`login-button ${isLoading ? 'loading' : ''} ${showFailure ? 'error' : ''}`}
        >
          {isLoading ? 'Logging in...' : showFailure ? '✕' : 'Login'}
        </button>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;