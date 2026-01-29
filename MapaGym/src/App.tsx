import { useState, useRef, useEffect } from 'react';
import Map, { Marker, GeolocateControl, NavigationControl} from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaSearch, FaUserCircle, FaFilter, FaDumbbell, FaPlus, FaQuestion } from 'react-icons/fa'; // Added FaQuestion
import { motion } from 'framer-motion';
import axiosClient from './api/axiosClient.js';
import { fetchShadowGyms } from './api/mapbox.ts'; // <--- IMPORT THE NEW HELPER

// IMPORT YOUR COMPONENTS
import AuthModal from './components/AuthModal';
import ScoutForm from './components/ScoutForm';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Gym {
  _id: string;
  name: string;
  description: string;
  dayPassPrice: number;
  isShadow?: boolean; // <--- NEW OPTIONAL FLAG
  location: {
    coordinates: [number, number]; // [Longitude, Latitude]
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

// Helper function with safety check for Shadow Gyms
const getGymTags = (gym: Gym): string[] => {
  const tags: string[] = [];
  if (gym.isShadow) return ["Unverified", "Tap to Scout"]; // Special tags for shadows
  
  if (gym.equipment?.hasDeadliftPlatform) tags.push("Deadlift");
  if (gym.equipment?.hasSquatRack) tags.push("Squat Racks");
  if (gym.equipment?.maxDumbbellWeight > 0) tags.push(`${gym.equipment.maxDumbbellWeight}kg DBs`);
  if (gym.amenities?.hasAC) tags.push("A/C");
  if (gym.amenities?.hasShowers) tags.push("Showers");
  return tags;
};

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
export default function App() {
  // STRICT TYPED STATE
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  
  // UI State
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [isScoutModalOpen, setIsScoutModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  
  // New State for Pre-filling the form
  const [scoutInitialData, setScoutInitialData] = useState<any>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('gymFinderUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Map Ref
  const mapRef = useRef<MapRef>(null);



  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const dbResponse = await axiosClient.get('/api/gyms');
        const verifiedGyms = dbResponse.data.data;
        const shadowGyms = await fetchShadowGyms(32.7157, -117.1611);
        
        const uniqueShadowGyms = shadowGyms.filter((shadow: any) => {
          return !verifiedGyms.some((verified: Gym) => 
            verified.name.toLowerCase() === shadow.name.toLowerCase()
          );
        });
        
        if (isMounted) {
          setGyms([...verifiedGyms, ...uniqueShadowGyms]);
        }
      } catch (error) {
        console.error("Error loading gyms:", error);
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []); 

  const handlePinClick = (gym: Gym) => {
    // 🔍 DEBUG: See exactly what data this gym has
    console.log("PIN CLICKED - Full Data:", gym);
    // IF SHADOW GYM -> Open Scout Form immediately
    if (gym.isShadow) {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        return;
      }
      
      // 1. EXTRACT DATA SAFELY
      // The Overpass data is hidden inside the 'tags' property we created in mapbox.js
      // We check if 'tags' exists, otherwise default to empty strings
      const rawTags = (gym as any).tags || {};

      setScoutInitialData({
        name: gym.name,
        location: gym.location.coordinates,
        website: rawTags.website || rawTags['contact:website'] || '', 
        phone: rawTags.phone || rawTags['contact:phone'] || '',
        tags: rawTags // Pass full tags object
      });

      setIsScoutModalOpen(true);
      return;
    }

    // IF VERIFIED GYM -> Open Details Sheet
    setSelectedGym(gym);
    setIsSheetOpen(true);
    mapRef.current?.flyTo({
      center: [gym.location.coordinates[0], gym.location.coordinates[1]], 
      zoom: 14, 
      duration: 1500
    });
  };

  const handleManualScoutClick = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setScoutInitialData(null); // Clear any pre-fill data
      setIsScoutModalOpen(true);
    }
  };

  return (
    <div className="relative h-screen w-full bg-zinc-900 overflow-hidden font-sans text-gray-100">
      
      {/* LAYER 1: MAP */}
      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: -117.1611, latitude: 32.7157, zoom: 13 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <GeolocateControl position="top-right" />
          <NavigationControl position="top-right" showCompass={false} />

          {gyms.map((gym) => (
            <Marker 
              key={gym._id} 
              longitude={gym.location.coordinates[0]} 
              latitude={gym.location.coordinates[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handlePinClick(gym);
              }}
            >
              <div className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                
                {/* Price Tag (Only show if verified) */}
                {!gym.isShadow && (
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1 transition-colors ${selectedGym?._id === gym._id ? 'bg-volt-green text-black' : 'bg-zinc-800 text-white border border-zinc-600'}`}>
                    ${gym.dayPassPrice}
                  </div>
                )}

                {/* The Icon (Green Dumbbell vs Grey Question Mark) */}
                {gym.isShadow ? (
                  <div className="bg-zinc-700/80 p-1.5 rounded-full border border-zinc-500 backdrop-blur-sm">
                     <FaQuestion className="text-xl text-zinc-300" />
                  </div>
                ) : (
                  <FaDumbbell className={`text-2xl drop-shadow-md transition-colors ${selectedGym?._id === gym._id ? 'text-volt-green' : 'text-zinc-400'}`} />
                )}
                
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* LAYER 2: HEADER WITH AUTH BUTTON */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-12 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto max-w-md mx-auto">
          
          <button 
            onClick={() => !currentUser ? setIsAuthModalOpen(true) : alert("Profile coming soon!")}
            className={`p-3 rounded-full backdrop-blur-md border transition-colors ${currentUser ? 'bg-volt-green text-black border-volt-green' : 'bg-zinc-800/80 text-white border-zinc-700 hover:bg-zinc-700'}`}
          >
            {currentUser ? <span className="font-bold px-1">{currentUser.name.charAt(0)}</span> : <FaUserCircle className="text-xl" />}
          </button>

          <div className="flex-1 bg-zinc-800/80 h-12 rounded-full backdrop-blur-md border border-zinc-700 flex items-center px-4 gap-2 shadow-xl">
            <FaSearch className="text-zinc-400" />
            <input 
              type="text" 
              placeholder="Find a gym..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder-zinc-500 text-white"
            />
          </div>

          <button className="bg-volt-green text-black font-bold p-3 rounded-full shadow-[0_0_15px_rgba(204,255,0,0.4)]">
            <FaFilter />
          </button>
        </div>
      </div>

      {/* SCOUT BUTTON (Manual) */}
      <button 
        onClick={handleManualScoutClick}
        className="absolute bottom-24 right-4 z-30 bg-volt-green text-black p-4 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center gap-2 font-bold hover:scale-105"
      >
        <FaPlus /> Scout
      </button>

      {/* MODALS */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onLoginSuccess={(user) => setCurrentUser(user)}
        />
      )}

     {isScoutModalOpen && (
  <ScoutForm 
    onClose={() => setIsScoutModalOpen(false)} 
    onGymAdded={(newGym) => setGyms([...gyms, newGym])}
    userLocation={scoutInitialData?.location || [-117.1550, 32.7250]} 
    initialName={scoutInitialData?.name || ''}
    initialWebsite={scoutInitialData?.website} 
    initialPhone={scoutInitialData?.phone}
    initialTags={scoutInitialData?.tags} 
  />
)}

      {/* LAYER 3: BOTTOM SHEET */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-20 bg-zinc-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-zinc-800"
        initial={{ y: "100%" }}
        animate={{ y: isSheetOpen ? "0%" : "85%" }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
            if (info.offset.y > 100) setIsSheetOpen(false);
            if (info.offset.y < -100) setIsSheetOpen(true);
        }}
      >
        <div className="w-full h-8 flex items-center justify-center cursor-pointer active:cursor-grabbing" onClick={() => setIsSheetOpen(!isSheetOpen)}>
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
        </div>

        <div className="p-4 h-[80vh] overflow-y-auto pb-32">
          
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold text-white">
              {selectedGym ? "Selected Gym" : "Nearby Gyms"}
            </h2>
            {selectedGym && (
              <button 
                onClick={() => setSelectedGym(null)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {(selectedGym ? [selectedGym] : gyms).map((gym) => (
              <div 
                key={gym._id} 
                onClick={() => handlePinClick(gym)}
                className={`
                  relative overflow-hidden rounded-2xl border border-zinc-700/50 cursor-pointer group
                  ${selectedGym?._id === gym._id ? 'ring-2 ring-volt-green/50 bg-zinc-800' : 'bg-zinc-800/40 hover:bg-zinc-800'}
                `}
              >
                <div className="h-32 w-full overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                   {/* Fallback image for Shadow Gyms */}
                   <img 
                      src={gym.isShadow ? "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=500&auto=format&fit=crop" : "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop"} 
                      className={`w-full h-full object-cover transition-transform duration-500 ${gym.isShadow ? 'grayscale opacity-50' : 'group-hover:scale-105'}`} 
                      alt={gym.name} 
                   />
                   
                   {!gym.isShadow && (
                     <span className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
                       ${gym.dayPassPrice} / Day
                     </span>
                   )}
                </div>

                <div className="p-4 relative z-20 -mt-6">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {gym.name}
                    {gym.isShadow && <span className="text-[10px] bg-zinc-700 px-1.5 rounded text-zinc-400">UNVERIFIED</span>}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">{gym.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {getGymTags(gym).map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold bg-zinc-900/80 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Different Button for Shadow Gyms */}
                  {selectedGym?._id === gym._id && (
                    <button className={`w-full mt-4 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity ${gym.isShadow ? 'bg-white text-black' : 'bg-volt-green text-black'}`}>
                      {gym.isShadow ? "Claim & Scout This Gym" : "View Details & Book"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}