import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaTimes, FaDumbbell, FaCheck } from 'react-icons/fa';

// 1. IMPORT OR DEFINE THE GYM TYPE
interface Gym {
  _id: string;
  name: string;
  description: string;
  dayPassPrice: number;
  location: {
    coordinates: [number, number];
  };
  equipment: {
    hasSquatRack: boolean;
    hasDeadliftPlatform: boolean;
    maxDumbbellWeight: number;
  };
  amenities: {
    hasAC: boolean;
    hasShowers: boolean;
  };
}

// 2. THE COMPONENT PROPS INTERFACE
interface ScoutFormProps {
  onClose: () => void;
  onGymAdded: (newGym: Gym) => void;
  userLocation: [number, number]; // [Longitude, Latitude]
}

// 3. THE COMPONENT
export default function ScoutForm({ onClose, onGymAdded, userLocation }: ScoutFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  
  // Typed Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayPassPrice: '',
    hasSquatRack: false,
    hasDeadliftPlatform: false,
    hasAC: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Get the current user's Token from browser memory
      const token = localStorage.getItem('gymFinderToken');
      
      if (!token) {
        alert("You must be logged in to scout a gym!");
        setLoading(false);
        return;
      }

      // 2. Configure the Auth Header for Axios
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // 3. Prepare the new gym data
      const newGymData = {
        name: formData.name,
        description: formData.description,
        dayPassPrice: Number(formData.dayPassPrice),
        owner: JSON.parse(localStorage.getItem('gymFinderUser') || '{}').id, 
        location: {
          type: "Point",
          coordinates: userLocation, 
          formattedAddress: "Scouted Location"
        },
        equipment: {
          hasSquatRack: formData.hasSquatRack,
          hasDeadliftPlatform: formData.hasDeadliftPlatform,
          maxDumbbellWeight: 0
        },
        amenities: {
          hasAC: formData.hasAC,
          hasShowers: false
        }
      };

      // 4. Send to Backend WITH the Token
      const response = await axios.post('http://localhost:5001/api/gyms', newGymData, config);
      
      onGymAdded(response.data.data);
      onClose();
    } catch (error: any) {
      console.error("Error saving gym:", error);
      alert(error.response?.data?.error || "Failed to save gym.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center"
    >
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        className="bg-zinc-900 w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border border-zinc-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-volt-green flex items-center gap-2">
            <FaDumbbell /> Scout a Gym
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Gym Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Iron Paradise" 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-volt-green"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Day Pass ($)</label>
              <input 
                required
                type="number" 
                placeholder="0" 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-volt-green"
                onChange={(e) => setFormData({...formData, dayPassPrice: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Vibe / Description</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Hardcore, heavy metal playing..." 
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white outline-none focus:border-volt-green"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Quick Filter Toggles */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Equipment Check</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, hasSquatRack: !formData.hasSquatRack})}
                className={`p-3 rounded-lg border text-sm font-bold flex justify-between items-center transition-all ${formData.hasSquatRack ? 'bg-volt-green text-black border-volt-green' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
              >
                Squat Rack {formData.hasSquatRack && <FaCheck />}
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, hasDeadliftPlatform: !formData.hasDeadliftPlatform})}
                className={`p-3 rounded-lg border text-sm font-bold flex justify-between items-center transition-all ${formData.hasDeadliftPlatform ? 'bg-volt-green text-black border-volt-green' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
              >
                Deadlift {formData.hasDeadliftPlatform && <FaCheck />}
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, hasAC: !formData.hasAC})}
                className={`p-3 rounded-lg border text-sm font-bold flex justify-between items-center transition-all ${formData.hasAC ? 'bg-volt-green text-black border-volt-green' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
              >
                A/C {formData.hasAC && <FaCheck />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-volt-green text-black font-extrabold py-4 rounded-xl mt-6 shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? "Adding to Map..." : "Add to Map (+50 XP)"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}