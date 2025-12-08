import React, { useState, useEffect } from "react";
import { Sprout, ChevronDown, RefreshCw, Loader2, Info } from "lucide-react";
import { useAuth } from "../../contexts/authcontext/Authcontext";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

const VegetationIndexCard = ({ field }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ndviData, setNdviData] = useState(null);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [dominantLabel, setDominantLabel] = useState(""); // State for dominant condition
  
  // Updated Options based on your Python Backend
  const [indexType, setIndexType] = useState("NDVI");

  // 1. Fetch Field Coordinates & Radius
  useEffect(() => {
    if (field && field.lat && field.lng) {
      setCoordinates({ 
        lat: field.lat, 
        lng: field.lng,
        radius: field.radius || 1.0 
      });
      return;
    }

    const fetchFieldData = async () => {
      if (!currentUser) return;
      try {
        const fieldRef = doc(db, "fields", currentUser.uid);
        const fieldSnap = await getDoc(fieldRef);
        
        if (fieldSnap.exists()) {
          const data = fieldSnap.data();
          if (data.lat && data.lng) {
            setCoordinates({ 
                lat: data.lat, 
                lng: data.lng,
                radius: data.radius || 1.0 
            });
          }
        }
      } catch (err) {
        console.error("Error fetching field:", err);
      }
    };
    fetchFieldData();
  }, [currentUser, field]);

  // 2. Trigger API
  useEffect(() => {
    if (coordinates) {
      fetchAnalysis(coordinates.lat, coordinates.lng, indexType, coordinates.radius);
    }
  }, [coordinates, indexType]);

  const fetchAnalysis = async (lat, lng, type, rad) => {
    setLoading(true);
    setError(null);
    setNdviData(null);
    setDominantLabel("");
    
    try {
      console.log(`🚀 Requesting ${type} Analysis...`);
      
      const response = await fetch("http://localhost:5000/api/analyze-ndvi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            lat, 
            lng, 
            indexType: type, // Sends "NDVI", "NDRE", etc.
            radius: rad 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNdviData(data);
        
        // 🔥 LOGIC: Calculate Dominant Condition from Statistics
        if (data.statistics) {
          // Find key with highest value
          const maxKey = Object.keys(data.statistics).reduce((a, b) => 
            data.statistics[a] > data.statistics[b] ? a : b
          );
          setDominantLabel(maxKey);
        }

      } else {
        setError(data.error || `Failed to process ${type} data.`);
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (coordinates) {
      fetchAnalysis(coordinates.lat, coordinates.lng, indexType, coordinates.radius);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 shadow-md bg-white/70 backdrop-blur-xl flex flex-col h-full">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white/50 backdrop-blur-md rounded-t-2xl">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-green-600" />
          Crop Analysis {field && `- ${field.name}`}
        </h3>

        <div className="flex gap-2">
          {coordinates && (
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <div className="relative">
            {/* 🔥 UPDATED DROPDOWN OPTIONS */}
            <select
              value={indexType}
              onChange={(e) => setIndexType(e.target.value)}
              className="appearance-none w-32 px-3 py-1 bg-white border border-gray-300
                         rounded-md text-xs text-gray-700 font-medium focus:ring-2 
                         focus:ring-green-300 outline-none cursor-pointer"
            >
              <option value="NDVI">NDVI (Health)</option>
              <option value="NDRE">NDRE (Growth)</option>
              <option value="SAVI">SAVI (Soil)</option>
              <option value="EVI">EVI (Dense)</option>
            </select>
            <ChevronDown className="h-3 w-3 absolute right-2 top-2 text-gray-600 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1 rounded-xl bg-gray-900 border border-gray-200 shadow-inner flex flex-col items-center justify-center overflow-hidden relative min-h-[450px]">
          
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
              <p className="text-sm text-gray-300">Running AI Model ({indexType})...</p>
            </div>
          ) : error ? (
            <div className="text-center p-4">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button onClick={handleRefresh} className="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-700">Retry</button>
            </div>
          ) : ndviData && ndviData.heatmap_base64 ? (
            <>
              {/* Heatmap Image */}
              <img 
                src={`data:image/png;base64,${ndviData.heatmap_base64}`} 
                alt={`${indexType} Heatmap`} 
                className="w-full h-full object-cover"
              />

              {/* 🔥 NEW: Statistics Overlay (Legend) */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md p-4 text-white border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-green-400">{indexType} Analysis</span>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white border border-white/10">
                    Dominant: {dominantLabel}
                  </span>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {ndviData.statistics && Object.entries(ndviData.statistics).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-300">{key}</span>
                      <span className="font-mono text-green-300">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
             <div className="text-center text-gray-500">
                <p>No Data Available</p>
                <p className="text-xs mt-1">Select an index to analyze</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VegetationIndexCard;
