import React from "react";

const AddFieldModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Field Details</h3>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Field Name</label>
            <input className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Area (hectares)</label>
            <input type="number" className="mt-1 w-full px-3 py-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Crop Type</label>
            <select className="mt-1 w-full px-3 py-2 border rounded-md">
              <option>Wheat</option>
              <option>Corn</option>
              <option>Soybean</option>
              <option>Rice</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md"
            >
              Cancel
            </button>

            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md">
              Save Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFieldModal;
