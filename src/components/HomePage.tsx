import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuthStatus } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  
  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        navigate('/activities');
      }
    };
    checkAuth();
  }, [navigate]);

  // The backend handles the entire OAuth flow. We just need to link to it.
  const stravaAuthUrl = 'http://localhost:5000/auth/strava';

  return (
    <div className="home-page">
      <h1>Welcome to the Route Variety Helper</h1>
      <p>Connect your Strava account to discover new points of interest along your routes.</p>
      <a href={stravaAuthUrl} className="button-strava">
        Login with Strava
      </a>
    </div>
  );
};

export default HomePage;