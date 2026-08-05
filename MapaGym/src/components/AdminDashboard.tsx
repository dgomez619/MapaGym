import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAdminStats, getAllUsers, getAllGyms } from '../api/admin';
import { FaUsers, FaBuilding, FaMapMarkedAlt, FaSignOutAlt, FaTrash, FaCheckCircle } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'user';
  rank?: string;
  xp?: number;
}

interface Gym {
  _id: string;
  name: string;
  dayPassPrice?: number;
  owner?: {
    name: string;
    role: string;
  };
}

interface Stats {
  totalUsers: number;
  gymGoers: number;
  gymOwners: number;
  totalGyms: number;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  // 1. THESE ARE THE MISSING VARIABLES!
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. FETCH ALL INTEL SIMULTANEOUSLY
  useEffect(() => {
    const fetchAllData = async () => {
      const [statsData, usersData, gymsData] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getAllGyms()
      ]);
      
      if (statsData) setStats(statsData);
      if (usersData) setUsers(usersData);
      if (gymsData) setGyms(gymsData);
      
      setLoading(false);
    };
    fetchAllData();
  }, []);

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center text-cyan-400 font-mono text-xl tracking-widest uppercase">Initializing Overwatch...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans selection:bg-cyan-500/30">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex justify-between items-end mb-10 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Overwatch Command
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-1">
            AUTHORIZED: {user?.name.toUpperCase()} // CLEARANCE: LEVEL {user?.role.toUpperCase()}
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <FaSignOutAlt /> Terminate Session
        </button>
      </div>

      {/* STATS BENTO GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <FaUsers className="absolute -right-4 -bottom-4 text-8xl text-zinc-800/50 group-hover:text-cyan-900/20 transition-colors" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Network</p>
          <p className="text-5xl font-black text-white">{stats?.totalUsers || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <FaUsers className="absolute -right-4 -bottom-4 text-8xl text-zinc-800/50 group-hover:text-cyan-900/20 transition-colors" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Field Agents</p>
          <p className="text-5xl font-black text-cyan-400">{stats?.gymGoers || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <FaBuilding className="absolute -right-4 -bottom-4 text-8xl text-zinc-800/50 group-hover:text-cyan-900/20 transition-colors" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Facility Owners</p>
          <p className="text-5xl font-black text-amber-400">{stats?.gymOwners || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <FaMapMarkedAlt className="absolute -right-4 -bottom-4 text-8xl text-zinc-800/50 group-hover:text-cyan-900/20 transition-colors" />
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Facilities</p>
          <p className="text-5xl font-black text-volt-green">{stats?.totalGyms || 0}</p>
        </motion.div>
      </div>

      {/* TABLES SECTION */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* USER DATABASE TABLE */}
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[500px]">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-400">User Database</h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Name</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Rank / XP</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {u.name}
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : u.role === 'owner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-volt-green font-bold text-xs uppercase">{u.rank || 'N/A'}</div>
                                    <div className="text-[10px] font-mono mt-0.5">{u.xp || 0} XP</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Delete User">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-zinc-600">No users found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>

         {/* FACILITY DIRECTORY TABLE */}
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden max-h-[500px]">
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-400">Facility Directory</h3>
            </div>
            <div className="overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-zinc-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Facility</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Added By</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gyms.map((g) => (
                            <tr key={g._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {g.name}
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">${g.dayPassPrice || 0} / Day</div>
                                </td>
                                <td className="px-6 py-4">
                                    {g.owner?.role === 'owner' ? (
                                        <span className="flex items-center gap-1 w-fit text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                            <FaCheckCircle /> Verified
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-volt-green uppercase tracking-widest">
                                            Field Scout
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs text-white truncate max-w-[120px]">{g.owner?.name || 'Unknown'}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{g.owner?.role || 'user'}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Delete Gym">
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {gyms.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-zinc-600">No facilities found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>

      </div>
    </div>
  );
}