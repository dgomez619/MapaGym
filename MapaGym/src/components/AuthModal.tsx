import React, { useState } from 'react';
// 1. CHANGE: Import your helper instead of generic axios
import axiosClient from '../api/axiosClient';
import { motion } from 'framer-motion';
import { FaTimes, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

// 1. THE TYPESCRIPT INTERFACE
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

// 2. THE COMPONENT
export default function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true); 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Typed Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Notice we keep the path relative (starts with /)
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      // 2. CHANGE: Use axiosClient.post(endpoint, ...)
      // We removed 'http://localhost:5001' because the client adds it automatically
      const response = await axiosClient.post(endpoint, formData);
      
      const token = response.data.token;
      const user = response.data.user;
      
      // Save to browser memory
      localStorage.setItem('gymFinderToken', token);
      localStorage.setItem('gymFinderUser', JSON.stringify(user));

      // Tell App.tsx we succeeded
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 50 }} animate={{ y: 0 }} 
        className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Join the Crew'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><FaTimes /></button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <FaUser className="absolute top-4 left-4 text-zinc-500" />
              <input 
                type="text" required placeholder="Name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-volt-green"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          <div className="relative">
            <FaEnvelope className="absolute top-4 left-4 text-zinc-500" />
            <input 
              type="email" required placeholder="Email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-volt-green"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <FaLock className="absolute top-4 left-4 text-zinc-500" />
            <input 
              type="password" required minLength={6} placeholder="Password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-volt-green"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-volt-green text-black font-extrabold py-3.5 rounded-xl mt-4 hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(204,255,0,0.3)] disabled:opacity-50"
          >
            {loading ? "Authenticating..." : (isLogin ? "Log In" : "Sign Up")}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-volt-green font-bold hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}