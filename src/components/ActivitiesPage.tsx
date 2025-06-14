import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActivities, checkAuthStatus } from '../services/api';
import { Activity } from '../types';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthAndActivities = async () => {
      // First, check if the user is authenticated
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        navigate('/'); // Redirect to home page if not logged in
        return;
      }

      // If authenticated, fetch their activities
      try {
        const userActivities = await getActivities();
        setActivities(userActivities);
      } catch (err) {
        setError('Failed to load activities. Please try logging in again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthAndActivities();
  }, [navigate]);

  const handleActivityClick = (activityId: number) => {
    navigate(`/activity/${activityId}`);
  };

  if (loading) return <div className="loader">Loading your activities...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Your Recent Activities</h2>
      {activities.length > 0 ? (
        <ul className="activity-list">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="activity-item"
              onClick={() => handleActivityClick(activity.id)}
            >
              <h3>{activity.name}</h3>
              <div className="activity-details">
                <span><strong>Type:</strong> {activity.type}</span> | 
                <span> <strong>Distance:</strong> {(activity.distance / 1000).toFixed(2)} km</span> |
                <span> <strong>Date:</strong> {new Date(activity.start_date).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recent activities with GPS data found.</p>
      )}
    </div>
  );
};

export default ActivitiesPage;