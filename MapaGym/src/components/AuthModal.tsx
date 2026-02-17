import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEnvelope, FaLock, FaUser, FaBuilding, FaDumbbell } from 'react-icons/fa';

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

export default function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true); 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // NEW: Role State (Default to 'user')
  const [role, setRole] = useState<'user' | 'owner'>('user');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Dynamic Styles based on Role
  const accentColor = role === 'owner' ? 'text-amber-400' : 'text-volt-green';
  const buttonColor = role === 'owner' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-volt-green hover:bg-volt-green/90';
  const ringColor = role === 'owner' ? 'focus:border-amber-400' : 'focus:border-volt-green';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      // PREPARE DATA: Include 'role' only if registering
      const payload = isLogin 
        ? { email: formData.email, password: formData.password } 
        : { ...formData, role }; 

      const response = await axiosClient.post(endpoint, payload);
      
      const { token, user } = response.data;
      
      // Save to browser
      localStorage.setItem('gymFinderToken', token);
      localStorage.setItem('gymFinderUser', JSON.stringify(user));

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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 w-full max-w-sm rounded-3xl p-8 shadow-2xl border border-zinc-800 relative overflow-hidden"
      >
        {/* DECORATIVE BACKGROUND GLOW */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 pointer-events-none ${role === 'owner' ? 'bg-amber-500' : 'bg-volt-green'}`}></div>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              {isLogin ? 'Access Terminal' : 'New User ID'}
            </h2>
            <p className={`text-xs font-bold tracking-widest uppercase ${accentColor}`}>
              {role === 'owner' ? 'Facility Command' : 'Field Agent Access'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><FaTimes size={20} /></button>
        </div>

        {/* ROLE SELECTOR (Only show on Sign Up) */}
        {!isLogin && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl mb-6 border border-zinc-800">
             <button 
               type="button"
               onClick={() => setRole('user')}
               className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
               ${role === 'user' ? 'bg-zinc-800 text-volt-green shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
             >
               <FaDumbbell size={14} /> Gym Goer
             </button>
             <button 
               type="button"
               onClick={() => setRole('owner')}
               className={`flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
               ${role === 'owner' ? 'bg-zinc-800 text-amber-400 shadow-lg border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
             >
               <FaBuilding size={14} /> Gym Owner
             </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="relative group">
              <FaUser className="absolute top-4 left-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input 
                type="text" required placeholder={role === 'owner' ? "Owner Name" : "Agent Name"}
                className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 pl-10 text-white outline-none transition-all ${ringColor}`}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}

          <div className="relative group">
            <FaEnvelope className="absolute top-4 left-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input 
              type="email" required placeholder="Email Address"
              className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 pl-10 text-white outline-none transition-all ${ringColor}`}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative group">
            <FaLock className="absolute top-4 left-4 text-zinc-600 group-focus-within:text-white transition-colors" />
            <input 
              type="password" required minLength={6} placeholder="Password"
              className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 pl-10 text-white outline-none transition-all ${ringColor}`}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full text-black font-black uppercase tracking-wider py-4 rounded-xl mt-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                Processing...
              </span>
            ) : (isLogin ? "Authenticate" : "Initialize ID")}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-zinc-600 mt-8 uppercase tracking-wide">
          {isLogin ? "No Credentials? " : "Already Registered? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className={`${accentColor} hover:underline ml-1`}
          >
            {isLogin ? "Create ID" : "Log In"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}