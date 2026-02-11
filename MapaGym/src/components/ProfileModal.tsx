import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaDumbbell, FaMedal, FaChartLine } from 'react-icons/fa';
import { IoHardwareChip } from "react-icons/io5";
import { getMyProfile } from '../api/user'; // <--- Import the helper

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  rank: string;
  trustScore: number;
  createdAt: string;
  scoutedGyms: any[];
  preferences: {
    tags: string[];
  }
}

interface ProfileModalProps {
  user: any; // We will refetch the full user inside here
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileModal({ onClose, onLogout }: ProfileModalProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // FETCH REAL DATA ON MOUNT
  useEffect(() => {
    const fetchData = async () => {
      const data = await getMyProfile();
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // CALCULATE NEXT RANK (Simple Gamification Logic)
  const nextRankXp = 500; // Hardcoded goal for now
  const progressPercent = profile ? Math.min((profile.xp / nextRankXp) * 100, 100) : 0;

  if (loading) return null; // Or a spinner

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 w-full max-w-md rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden relative"
      >
        {/* DECORATIVE: Top Circuit Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-800 via-volt-green to-zinc-800 opacity-50"></div>

        {/* HEADER SECTION */}
        <div className="p-6 pb-0 relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>

          <div className="flex items-center gap-4 mb-6">
            {/* AVATAR */}
            <div className="w-20 h-20 bg-zinc-900 rounded-2xl border-2 border-volt-green flex items-center justify-center relative shadow-[0_0_15px_rgba(204,255,0,0.2)]">
               <span className="text-3xl font-black text-white">{profile?.name.charAt(0).toUpperCase()}</span>
               <div className="absolute -bottom-3 bg-zinc-900 text-volt-green text-[10px] font-bold px-2 py-0.5 border border-zinc-700 rounded-full uppercase tracking-wider">
                 LVL {Math.floor((profile?.xp || 0) / 100) + 1}
               </div>
            </div>

            {/* NAME & RANK */}
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{profile?.name}</h2>
              <div className="flex items-center gap-2 text-volt-green">
                <FaMedal size={12} />
                <span className="text-xs font-bold tracking-widest uppercase">{profile?.rank || "Novice"}</span>
              </div>
              <p className="text-zinc-500 text-xs font-mono mt-1">ID: {profile?.id.slice(-6).toUpperCase()} // EST. {new Date(profile?.createdAt || '').getFullYear()}</p>
            </div>
          </div>

          {/* XP BAR */}
          <div className="mb-2 flex justify-between text-[10px] font-mono text-zinc-400">
             <span>XP PROGRESS</span>
             <span>{profile?.xp} / {nextRankXp}</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} 
              className="h-full bg-volt-green shadow-[0_0_10px_rgba(204,255,0,0.5)]"
            />
          </div>
        </div>

        {/* BENTO GRID STATS */}
        <div className="p-6 grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1 group hover:border-volt-green/30 transition-colors">
             <FaDumbbell className="text-zinc-500 group-hover:text-volt-green transition-colors" />
             <span className="text-xl font-black text-white">{profile?.scoutedGyms.length || 0}</span>
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Scouts</span>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1 group hover:border-volt-green/30 transition-colors">
             <IoHardwareChip className="text-zinc-500 group-hover:text-volt-green transition-colors" />
             <span className="text-xl font-black text-white">{profile?.trustScore}%</span>
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Accuracy</span>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-1 group hover:border-volt-green/30 transition-colors">
             <FaChartLine className="text-zinc-500 group-hover:text-volt-green transition-colors" />
             <span className="text-xl font-black text-white">Top 5%</span>
             <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Region</span>
          </div>
        </div>

        {/* LOADOUT / PREFERENCES */}
        <div className="px-6 pb-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <IoHardwareChip /> Active Loadout
          </h3>
          <div className="flex flex-wrap gap-2">
            {(profile?.preferences?.tags.length ? profile.preferences.tags : ['General Fitness', 'No Preferences']).map((tag) => (
              <span key={tag} className="text-[10px] font-bold bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded border border-zinc-800 flex items-center gap-1">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 pt-0 flex gap-3">
          <button 
            onClick={onLogout}
            className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 font-bold hover:text-white hover:bg-red-900/20 hover:border-red-900/50 transition-all text-sm uppercase tracking-wide"
          >
            Log Out
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}