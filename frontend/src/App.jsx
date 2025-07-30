import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Dashboard from "./components/Dashboard"; // ✅ use the right Dashboard
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import Weather from "./components/Weather";
import ApiKeyTester from "./components/ApiKeyTester";
import TrafficPage from "./Pages/TrafficPage";
import AirQuality from './components/AirQuality';
import CityDashboard from './components/CityDashboard';
import Chatbot from './components/Chatbot';

import "leaflet/dist/leaflet.css";

// Enable future flags for React Router v7
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ChakraProvider>
      <Router {...router}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/api-test" element={<ApiKeyTester />} />
          <Route path="/traffic" element={<TrafficPage />} />
          <Route path="/airquality" element={<AirQuality />} />
          <Route path="/city-dashboard" element={<CityDashboard />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
