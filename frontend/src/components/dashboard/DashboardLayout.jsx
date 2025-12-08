import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import StatsCards from "./StatsCards";
import FieldMap from "./FieldMap";
import VegetationIndexCard from "./VegetationIndexCard";
import NewsSection from "./NewsSection";
import AddFieldModal from "./AddFieldModal";

const DashboardLayout = ({ currentUser, onLogout }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      <Sidebar />

      {/* Light green + glass effect */}
      <div
  className="
    pt-20 lg:ml-64 p-6 min-h-screen 
    bg-gradient-to-br from-green-50 via-white to-green-100
  "
>
        <div className="max-w-screen-2xl mx-auto">

          <StatsCards />

          {/* Larger map + larger vegetation card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* BIGGER FIELD MAP */}
            <div className="lg:col-span-2">
              <div className="h-[600px]">
                <FieldMap onOpen={() => setShowModal(true)} />
              </div>
            </div>

            {/* BIGGER VEGETATION INDEX */}
            <div className="h-[420px]">
              <VegetationIndexCard />
            </div>

          </div>

          <NewsSection />
        </div>
      </div>

      <AddFieldModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default DashboardLayout;
