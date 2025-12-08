import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authcontext/Authcontext";
import { doSignOut } from "../firebase/auth";

import DashboardLayout from "../components/dashboard/DashboardLayout";

const Home = () => {
  const { currentUser, userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!userLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
};

export default Home;
