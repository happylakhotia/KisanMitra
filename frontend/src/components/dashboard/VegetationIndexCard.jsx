import React from "react";
import { Sprout, ChevronDown } from "lucide-react";

const VegetationIndexCard = () => {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-md bg-white/70 backdrop-blur-xl">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white/50 backdrop-blur-md rounded-t-2xl">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-green-600" />
          Vegetation Index
        </h3>

        <div className="relative">
          <select
            className="appearance-none w-32 px-3 py-2 bg-white border border-gray-300
                       rounded-md text-sm text-gray-700 font-medium focus:ring-2 
                       focus:ring-green-300 outline-none cursor-pointer"
          >
            <option>NDVI</option>
            <option>EVI</option>
            <option>SAVI</option>
            <option>MSAVI</option>
          </select>
          <ChevronDown className="h-4 w-4 absolute right-2 top-3 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div
          className="h-[490px] rounded-xl bg-white 
                     border border-gray-200 shadow-inner flex items-center justify-center"
        >
          <p className="text-gray-500 text-sm opacity-80">
            NDVI / EVI / SAVI visualization (coming soon)
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default VegetationIndexCard;
