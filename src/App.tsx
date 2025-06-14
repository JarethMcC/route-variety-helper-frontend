import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ActivitiesPage from './components/ActivitiesPage';
import MapPage from './components/MapPage';
import { APIProvider } from '@vis.gl/react-google-maps';

function App() {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_JAVASCRIPT_KEY;

  if (!googleMapsApiKey) {
    return (
      <div className="container error">
        <h1>Configuration Error</h1>
        <p>Google Maps API key is missing. Please add it to your .env file.</p>
      </div>
    );
  }
  
  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <Router>
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activity/:activityId" element={<MapPage />} />
          </Routes>
        </div>
      </Router>
    </APIProvider>
  );
}

export default App;