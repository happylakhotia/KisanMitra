import React from "react";

const FieldDetailsDrawer = ({ open, onClose }) => {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Add Field Details</h2>
        <button onClick={onClose} className="text-gray-500 text-xl hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">

        {/* Crop Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Crop Name</label>
          <input
            type="text"
            placeholder="Corn, Wheat…"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Field Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Field Name</label>
          <input
            type="text"
            placeholder="North Block A"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Sowing Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Sowing Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Upload Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Upload Field & Crop Images</label>
          <div className="border-2 border-dashed rounded-md p-5 text-center cursor-pointer hover:border-green-600 transition">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">Drop images here or click to browse</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white py-2 rounded-md mt-4 hover:bg-green-700"
        >
          Save Field Details
        </button>
      </div>
    </div>
  );
};

export default FieldDetailsDrawer;
