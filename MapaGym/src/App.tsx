import { useState, useRef } from 'react';
import Map, { Marker, GeolocateControl, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaSearch, FaUserCircle, FaFilter, FaDumbbell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// 1. Mock Data: This represents what your Backend will eventually send
interface Gym {
  id: number;
  name: string;
  lat: number;
  long: number;
  price: string;
  tags: string[];
  image: string;
}

const gymsData: Gym[] = [
  { 
    id: 1, 
    name: "Iron Paradise San Diego", 
    lat: 32.7157, 
    long: -117.1611, 
    price: "$15", 
    tags: ["Deadlift Platform", "A/C", "Sauna"],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop"
  },
  { 
    id: 2, 
    name: "Metro Flex Gym", 
    lat: 32.7200, 
    long: -117.1500, 
    price: "$10", 
    tags: ["Hardcore", "No A/C", "Chalk Allowed"],
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=500&auto=format&fit=crop" 
  },
  { 
    id: 3, 
    name: "Luxury Equinox", 
    lat: 32.7100, 
    long: -117.1550, 
    price: "$45", 
    tags: ["Pool", "Spa", "Towel Service"],
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=500&auto=format&fit=crop"
  }
];

export default function App() {
  // 2. State Management
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null); // Which gym did the user click?
  const [isSheetOpen, setIsSheetOpen] = useState(false); // Is the drawer up?
  
  // Ref for the map so we can programmatically fly to locations
  const mapRef = useRef<any>(null);

  // Handle Pin Click
  const handlePinClick = (gym: Gym) => {
    setSelectedGym(gym);
    setIsSheetOpen(true); // Auto-open the drawer
    
    // Smooth Fly-to animation
    mapRef.current?.flyTo({center: [gym.long, gym.lat], zoom: 14, duration: 1500});
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
          {/* Native Mapbox Controls (Top Right) */}
          <GeolocateControl position="top-right" />
          <NavigationControl position="top-right" showCompass={false} />

          {/* Render Pins */}
          {gymsData.map((gym) => (
            <Marker 
              key={gym.id} 
              longitude={gym.long} 
              latitude={gym.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation(); // Prevent map click from closing it
                handlePinClick(gym);
              }}
            >
              <div className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                {/* Price Badge */}
                <div className={`
                  text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1 transition-colors
                  ${selectedGym?.id === gym.id ? 'bg-volt-green text-black' : 'bg-zinc-800 text-white border border-zinc-600'}
                `}>
                  {gym.price}
                </div>
                {/* Icon */}
                <FaDumbbell className={`
                  text-2xl drop-shadow-md transition-colors
                  ${selectedGym?.id === gym.id ? 'text-volt-green' : 'text-zinc-400'}
                `} />
              </div>
            </Marker>
          ))}
        </Map>
      </div>

      {/* LAYER 2: HEADER */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-12 bg-linear-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto max-w-md mx-auto">
          <button className="bg-zinc-800/80 p-3 rounded-full backdrop-blur-md border border-zinc-700 hover:bg-zinc-700 transition-colors">
            <FaUserCircle className="text-xl text-white" />
          </button>

          <div className="flex-1 bg-zinc-800/80 h-12 rounded-full backdrop-blur-md border border-zinc-700 flex items-center px-4 gap-2 shadow-xl">
            <FaSearch className="text-zinc-400" />
            <input 
              type="text" 
              placeholder="Find a gym..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder-zinc-500 text-white"
            />
          </div>

          <button className="bg-volt-green text-black font-bold p-3 rounded-full shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:scale-105 transition-transform">
            <FaFilter />
          </button>
        </div>
      </div>

      {/* LAYER 3: BOTTOM SHEET */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-20 bg-zinc-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] border-t border-zinc-800"
        initial={{ y: "100%" }}
        animate={{ y: isSheetOpen ? "0%" : "85%" }} // 85% means mostly hidden (only peek visible)
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
            if (info.offset.y > 100) setIsSheetOpen(false); // Drag down to close
            if (info.offset.y < -100) setIsSheetOpen(true); // Drag up to open
        }}
      >
        {/* Handle Bar */}
        <div className="w-full h-8 flex items-center justify-center cursor-pointer active:cursor-grabbing" onClick={() => setIsSheetOpen(!isSheetOpen)}>
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
        </div>

        {/* Content Area */}
        <div className="p-4 h-[80vh] overflow-y-auto pb-32">
          
          {/* HEADER: Dynamic based on selection */}
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
          
          {/* LIST: Show either the single selected gym OR the full list */}
          <div className="space-y-4">
            {(selectedGym ? [selectedGym] : gymsData).map((gym) => (
              <div 
                key={gym.id} 
                onClick={() => handlePinClick(gym)}
                className={`
                  relative overflow-hidden rounded-2xl border border-zinc-700/50 cursor-pointer group
                  ${selectedGym?.id === gym.id ? 'ring-2 ring-volt-green/50 bg-zinc-800' : 'bg-zinc-800/40 hover:bg-zinc-800'}
                `}
              >
                {/* Image Background for Card */}
                <div className="h-32 w-full overflow-hidden relative">
                   <div className="absolute inset-0 bg-linear-to-t from-zinc-900 to-transparent z-10" />
                   <img src={gym.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={gym.name} />
                   <span className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
                     {gym.price} / Day
                   </span>
                </div>

                {/* Card Content */}
                <div className="p-4 relative z-20 -mt-6">
                  <h3 className="font-bold text-white text-lg">{gym.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {gym.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold bg-zinc-900/80 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Action Button (Only visible if selected) */}
                  {selectedGym?.id === gym.id && (
                    <button className="w-full mt-4 bg-volt-green text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
                      View Details & Book
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