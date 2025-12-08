import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import StatsCards from "./StatsCards";
import FieldMap from "./FieldMap";
import VegetationIndexCard from "./VegetationIndexCard";
import NewsSection from "./NewsSection";
import AddFieldModal from "./AddFieldModal";
import AIAssistant from "./AIAssistant";
import { Bot } from "lucide-react";

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
    bg-linear-to-br from-green-50 via-white to-green-100
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

          {/* AI ASSISTANCE SECTION */}
          <section
            id="ai-assistance"
            className="mt-10 scroll-mt-24"
            aria-label="AI Assistance"
          >
            {/* Section Header */}
            <div className="flex flex-col gap-2 mb-4 md:mb-6">
              <div className="inline-flex items-center gap-2 text-green-700 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full w-fit border border-green-100">
                <Bot className="h-4 w-4" />
                <span>AI Assistance</span>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  Smart help for your farm
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1 max-w-2xl">
                  Ask questions about soil health, fertilizer dose, irrigation, and pest control.
                  The AI will respond in simple farmer-friendly English.
                </p>
              </div>
            </div>

            {/* Section Body */}
            <div className="bg-white/80 backdrop-blur-sm border border-green-100 rounded-3xl shadow-lg shadow-green-100/40 p-3 md:p-4 lg:p-5">
              <AIAssistant />
            </div>
          </section>

          <NewsSection />
        </div>
      </div>

      <AddFieldModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

export default DashboardLayout;
