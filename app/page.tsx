'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowRight, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export default function AuthPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isToggling, setIsToggling] = useState(false);

  const lightTheme = {
    bg: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    cardBg: 'bg-white/70 backdrop-blur-lg',
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    secondary: 'bg-gradient-to-r from-purple-500 to-pink-500',
    accent: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    text: 'text-slate-800',
    textSecondary: 'text-slate-600',
    border: 'border-white/20',
    shadow: 'shadow-lg shadow-blue-500/10',
    headerBg: 'bg-white/80 backdrop-blur-md',
    footerBg: 'bg-white/60 backdrop-blur-md'
  };

  const darkTheme = {
    bg: 'bg-gradient-to-br from-black via-gray-900 to-slate-900',
    cardBg: 'bg-gray-900/80 backdrop-blur-lg border-gray-700/50',
    primary: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600',
    secondary: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600',
    accent: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-700/50',
    shadow: 'shadow-2xl shadow-purple-500/20',
    headerBg: 'bg-black/80 backdrop-blur-md border-gray-800/50',
    footerBg: 'bg-black/60 backdrop-blur-md border-gray-800/50'
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleThemeToggle = () => {
    setIsToggling(true);
    setTimeout(() => {
      setIsDarkMode(!isDarkMode);
    }, 300);
    setTimeout(() => {
      setIsToggling(false);
    }, 800);
  };

  // Animation variants
  const slideInUp = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const router = useRouter();

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'ADMIN') {
            router.push('/admin/overview');
          } else {
            router.push('/questions');
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userData');
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
      }
    };

    validateAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const signupUser = async (userData: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data: AuthResponse;
      
      if (isSignUp) {
        data = await signupUser({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      } else {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Sign in failed');
        }

        data = await response.json();
      }

      localStorage.setItem('authToken', data.token || 'mock-token');
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userData', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        router.push('/admin/overview');
      } else {
        router.push('/questions');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const mockUser = {
        id: 'google-user-123',
        name: 'Google User',
        email: 'user@gmail.com',
        role: 'USER' as const,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('authToken', 'google-token');
      localStorage.setItem('userRole', mockUser.role);
      localStorage.setItem('userData', JSON.stringify(mockUser));

      router.push('/questions');
    } catch (err) {
      setError('Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const mockUser = {
        id: 'apple-user-123',
        name: 'Apple User',
        email: 'user@icloud.com',
        role: 'USER' as const,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('authToken', 'apple-token');
      localStorage.setItem('userRole', mockUser.role);
      localStorage.setItem('userData', JSON.stringify(mockUser));

      router.push('/questions');
    } catch (err) {
      setError('Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('authToken', 'guest-token');
    localStorage.setItem('userRole', 'USER');
    localStorage.setItem('userData', JSON.stringify({
      id: 'guest',
      name: 'Guest User',
      email: 'guest@stackit.com',
      role: 'USER'
    }));
    
    router.push('/questions');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (isSignUp && !formData.name) {
      setError('Name is required for sign up');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-all duration-700 relative overflow-hidden`}>
      {/* Theme Toggle Overlay */}
      <AnimatePresence>
        {isToggling && (
          <motion.div
            className={`fixed inset-0 z-[100] ${isDarkMode ? 'bg-black' : 'bg-white'}`}
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        className={`${theme.headerBg} ${theme.border} border-b sticky top-0 z-50`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2 sm:space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.primary} rounded-lg flex items-center justify-center`}>
                <span className="font-bold text-sm sm:text-lg text-white">S</span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>StackIt</h1>
            </motion.div>
            
            <motion.button
              onClick={handleThemeToggle}
              className={`p-2 rounded-full ${theme.cardBg} ${theme.border} border hover:scale-110 transition-all duration-300 ${theme.shadow}`}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkMode ? 
                <Sun className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.text}`} /> : 
                <Moon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.text}`} />
              }
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div 
          className={`w-full max-w-md ${theme.cardBg} ${theme.border} rounded-xl ${theme.shadow} p-6 sm:p-8`}
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-6"
          >
            <motion.h1 
              className={`text-2xl sm:text-3xl font-bold ${theme.text} mb-2`}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </motion.h1>
            <motion.p className={`${theme.textSecondary}`}>
              {isSignUp ? 'Join our developer community' : 'Sign in to continue'}
            </motion.p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Form */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4 mb-6"
            variants={staggerContainer}
          >
            {isSignUp && (
              <motion.div>
                <label htmlFor="name" className={`block text-sm font-medium ${theme.text} mb-1`}>
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.text} ${theme.cardBg}`}
                  placeholder="Enter your name"
                  required={isSignUp}
                />
              </motion.div>
            )}

            <motion.div>
              <label htmlFor="email" className={`block text-sm font-medium ${theme.text} mb-1`}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.text} ${theme.cardBg}`}
                placeholder="Enter your email"
                required
              />
            </motion.div>

            <motion.div>
              <label htmlFor="password" className={`block text-sm font-medium ${theme.text} mb-1`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme.text} ${theme.cardBg}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-2.5 ${theme.textSecondary} hover:${theme.text}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full ${theme.primary} text-white py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all ${theme.shadow}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <motion.div 
            className="relative mb-6"
          >
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${theme.border}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${theme.cardBg} ${theme.textSecondary}`}>or</span>
            </div>
          </motion.div>

          {/* Social Sign-in Buttons */}
          <motion.div 
            className="space-y-3 mb-6"
            variants={staggerContainer}
          >
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-2 ${theme.border} rounded-md hover:bg-opacity-10 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors ${theme.cardBg} ${theme.text}`}
              whileHover={{ y: -2 }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </motion.button>

            <motion.button
              onClick={handleAppleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-2 ${theme.cardBg} ${theme.border} rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors ${theme.text}`}
              whileHover={{ y: -2 }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span>Continue with Apple</span>
            </motion.button>
          </motion.div>

          {/* Continue as Guest */}
          <motion.button
            onClick={handleContinueAsGuest}
            className={`w-full ${theme.textSecondary} hover:${theme.text} py-2 text-sm underline transition-colors`}
          >
            Continue as Guest
          </motion.button>

          {/* Toggle Sign In/Sign Up */}
          <motion.div 
            className="text-center mt-6"
          >
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className={`text-sm ${theme.textSecondary} hover:${theme.text} transition-colors`}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Footer */}
      <motion.footer 
        className={`${theme.footerBg} ${theme.border} border-t py-6 sm:py-8`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className={`${theme.textSecondary} text-sm sm:text-base`}>
            © 2025 StackIt. Built with ❤️ for developers, by developers.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}