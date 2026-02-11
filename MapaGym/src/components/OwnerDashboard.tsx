import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaDumbbell, FaChartLine, FaCog, FaSignOutAlt, 
  FaBars, FaTimes, FaExclamationTriangle, FaCheckCircle, FaUsers 
} from 'react-icons/fa';
import { IoHardwareChip } from "react-icons/io5";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

export default function OwnerDashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [gymStatus, setGymStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  // MOCK DATA FOR DASHBOARD
  const revenueData = [450, 670, 890, 1200, 1100, 1450, 1800]; // Simple trend
  const alerts = [
    { id: 1, type: 'critical', message: 'Squat Rack #2 reported broken', time: '10m ago' },
    { id: 2, type: 'warning', message: 'Sauna temperature high alert', time: '2h ago' },
  ];

  const MenuItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all mb-2 font-bold uppercase tracking-wider text-xs
        ${activeTab === id 
          ? 'bg-volt-green text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
        }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      
      {/* 1. SIDEBAR - DESKTOP (Fixed) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-volt-green rounded-lg flex items-center justify-center text-black">
            <IoHardwareChip size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none tracking-tighter">IRON</h1>
            <h2 className="text-[10px] font-bold text-zinc-500 tracking-[0.2em]">COMMAND</h2>
          </div>
        </div>

        <nav className="flex-1">
          <MenuItem id="overview" icon={FaHome} label="Mission Control" />
          <MenuItem id="my-gym" icon={FaDumbbell} label="My Gym" />
          <MenuItem id="analytics" icon={FaChartLine} label="Analytics" />
          <MenuItem id="settings" icon={FaCog} label="Settings" />
        </nav>

        <div className="pt-6 border-t border-zinc-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center">
                <span className="font-bold text-xs">{user?.name.charAt(0)}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase">Owner Access</p>
              </div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center gap-3 text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider p-2">
             <FaSignOutAlt /> Log Out
           </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER (Visible only on mobile) */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
           <IoHardwareChip className="text-volt-green" />
           <span className="font-black tracking-tighter">IRON COMMAND</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            className="absolute inset-0 z-40 bg-zinc-950 p-6 pt-20 md:hidden"
          >
             <MenuItem id="overview" icon={FaHome} label="Overview" />
             <MenuItem id="my-gym" icon={FaDumbbell} label="My Gym" />
             <MenuItem id="analytics" icon={FaChartLine} label="Analytics" />
             <MenuItem id="settings" icon={FaCog} label="Settings" />
             <button onClick={onLogout} className="mt-8 w-full py-4 bg-zinc-900 text-red-500 font-bold rounded-xl">LOG OUT</button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* TOP STATUS BAR */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur flex items-center justify-between px-8 mt-16 md:mt-0">
          <div className="flex items-center gap-4">
             <span className="text-zinc-500 text-xs font-mono">STATUS:</span>
             <button 
               onClick={() => setGymStatus(gymStatus === 'OPEN' ? 'CLOSED' : 'OPEN')}
               className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-2
               ${gymStatus === 'OPEN' ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-red-900/20 text-red-400 border-red-900'}`}
             >
               <span className={`w-2 h-2 rounded-full ${gymStatus === 'OPEN' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
               {gymStatus}
             </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest hidden md:block">San Diego, CA</span>
          </div>
        </header>

        {/* DASHBOARD CONTENT (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* WELCOME BANNER */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white uppercase italic">Welcome Back, Commander.</h1>
            <p className="text-zinc-500 text-sm mt-1">Here is your facility report for today.</p>
          </div>

          {/* BENTO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* WIDGET 1: REVENUE GRAPH (Large) */}
            <div className="col-span-1 md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-colors">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Weekly Revenue</h3>
                   <div className="text-3xl font-mono font-bold text-white mt-1">$4,250.00</div>
                 </div>
                 <div className="bg-volt-green/10 text-volt-green px-2 py-1 rounded text-xs font-bold">+12%</div>
               </div>
               
               {/* FAKE GRAPH BARS */}
               <div className="flex items-end gap-2 h-32 w-full mt-4">
                  {revenueData.map((h, i) => (
                    <div key={i} className="flex-1 bg-zinc-800 hover:bg-volt-green transition-colors rounded-t-sm" style={{ height: `${(h / 2000) * 100}%` }}></div>
                  ))}
               </div>
            </div>

            {/* WIDGET 2: LIVE OCCUPANCY (Square) */}
            <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group hover:border-volt-green/50 transition-colors">
               <div className="flex justify-between items-start">
                  <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Live Traffic</h3>
                  <FaUsers className="text-zinc-600" />
               </div>
               <div className="mt-4">
                  <div className="text-4xl font-mono font-black text-white">42</div>
                  <div className="text-xs text-zinc-500 mt-2">Members Active</div>
               </div>
               <div className="mt-4 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-volt-green w-[60%] h-full shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
               </div>
               <div className="text-[10px] text-volt-green mt-2 font-bold uppercase text-right">High Load</div>
            </div>

            {/* WIDGET 3: ALERTS (Wide) */}
            <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
               <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                 <FaExclamationTriangle className="text-yellow-500" /> System Alerts
               </h3>
               <div className="space-y-3">
                 {alerts.map(alert => (
                   <div key={alert.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm font-bold text-zinc-300">{alert.message}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">{alert.time}</span>
                   </div>
                 ))}
                 {alerts.length === 0 && <div className="text-zinc-500 text-sm italic">All systems nominal.</div>}
               </div>
            </div>

            {/* WIDGET 4: RECENT ACTION */}
            <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
               <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                 <FaCheckCircle className="text-volt-green" /> Recent Check-ins
               </h3>
               <div className="space-y-2">
                  {[1,2,3].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">U{i}</div>
                          <span className="text-sm text-zinc-300">Member #{290 + i}</span>
                       </div>
                       <span className="text-[10px] text-zinc-600 font-mono">12:0{i} PM</span>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}