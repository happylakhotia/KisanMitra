import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/authcontext/Authcontext'
import { SidebarProvider } from './contexts/sidebarcontext/SidebarContext'
import Landing from './components/landing/Landing'
import Login from './components/auth/login/Login'
import Register from './components/auth/register/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Header from './components/header/Header'
import FarmSelection from "./pages/FarmSelection";
import Features from "./pages/Features";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import LiveCheck from './pages/LiveCheck'
import PestScanner from './pages/PestScanner'
import SoilAnalysis from './pages/SoilAnalysis'
import Logistics from './pages/Logistics'
import Insurance from './pages/Insurance'
import Machinery from './pages/Machinery'
import FindCustomers from './pages/FindCustomers'
import VendorDashboard from './pages/VendorDashboard'
import VendorOpportunities from './pages/VendorOpportunities'
import UserTypeSelection from './components/auth/UserTypeSelection'
import Chat from './pages/Chat'
import Reports from './pages/Reports'
import { API_BASE_URL } from './api/endpoints'
import './App.css'


function App() {
  // Wake up backend and HuggingFace models on app load to prevent cold starts
  useEffect(() => {
    const wakeUpServices = async () => {
      // 1. Wake up backend
      try {
        console.log('🔥 Warming up backend...');
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log('✅ Backend is awake and ready');
        } else {
          console.log('⚠️ Backend responded but with error status');
        }
      } catch (error) {
        console.log('⏳ Backend is waking up...', error.message);
        // Retry once after 2 seconds if first attempt fails
        setTimeout(async () => {
          try {
            await fetch(`${API_BASE_URL}/health`);
            console.log('✅ Backend is now awake');
          } catch (e) {
            console.log('⚠️ Backend warmup retry failed, will wake on first real request');
          }
        }, 2000);
      }

      // 2. Wake up critical HuggingFace Spaces (in background, don't wait)
      const hfSpaces = [
        'https://Happy-1234-lstm-happy-2.hf.space',
        'https://Happy-1234-dis-32-happy.hf.space',
        'https://Happy-1234-pest-2-happy.hf.space',
        'https://Happy-1234-indexes-2all.hf.space'
      ];

      // Wake them up in parallel without blocking
      hfSpaces.forEach((url, index) => {
        setTimeout(() => {
          fetch(url, { method: 'GET' })
            .then(() => console.log(`✅ HF Space ${index + 1} awake`))
            .catch(() => console.log(`⏳ HF Space ${index + 1} waking up...`));
        }, index * 1000); // Stagger by 1 second each to avoid overwhelming
      });
    };

    wakeUpServices();
  }, []);

  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <Header />
        <Routes>
          console.log("entered routes")
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          console.log("entered landing")
          <Route path="/user-type" element={<UserTypeSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/farm-selection" element={<FarmSelection />} />
          <Route path="/features" element={<Features />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/disease-detection" element={<LiveCheck/>}/>
          <Route path="/pest-scanner" element={<PestScanner/>}/>
          <Route path="/soil-analysis" element={<SoilAnalysis/>}/>
          <Route path="/logistics" element={<Logistics/>}/>
          <Route path="/insurance" element={<Insurance/>}/>
          <Route path="/machinery" element={<Machinery/>}/>
          <Route path="/find-customers" element={<FindCustomers/>}/>
          <Route path="/vendor-dashboard" element={<VendorDashboard/>}/>
          <Route path="/vendor-opportunities" element={<VendorOpportunities/>}/>
          <Route path="/reports" element={<Reports/>}/>
          <Route path="/chat/:otherUserId" element={<Chat/>}/>

          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
