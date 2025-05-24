import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { login } from '../store/authSlice';

interface SignInPromptModalProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const SignInPromptModal: React.FC<SignInPromptModalProps> = ({
  onComplete,
  onCancel
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Dispatch login action
      await dispatch(login({ email, password }));
      onComplete();
    } catch (err) {
      setError('Failed to sign in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle continue as guest
  const handleContinueAsGuest = () => {
    onCancel();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Sign In to Save Your Progress</h2>
        
        <p className="text-gray-600 mb-6">
          Sign in to save your quiz progress and see your results. Your answers have been temporarily saved.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="your@email.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-md text-white font-medium ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full py-2 bg-gray-200 rounded-md text-gray-800 font-medium hover:bg-gray-300"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
