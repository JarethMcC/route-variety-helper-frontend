import axios from 'axios';
import { Activity, POI, ActivityStream } from '../types';

// Create an Axios instance configured to talk to the backend.
// `withCredentials` is crucial for sending the session cookie.
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, 
});

/**
 * Checks if the user is currently authenticated with the backend.
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get<{ authenticated: boolean }>('/auth/status');
    return response.data.authenticated;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Fetches the list of Strava activities for the authenticated user.
 */
export const getActivities = async (): Promise<Activity[]> => {
  const response = await apiClient.get<Activity[]>('/api/activities');
  return response.data;
};

/**
 * Fetches the raw GPS data (stream) for a single activity.
 * This uses the new endpoint you added to app.py.
 */
export const getActivityStream = async (activityId: number): Promise<ActivityStream> => {
  const response = await apiClient.get<{ stream: ActivityStream }>(`/api/activities/${activityId}/stream`);
  return response.data.stream;
};

/**
 * Sends a route's GPS data to the backend to find nearby POIs.
 */
export const findPOIs = async (route: ActivityStream): Promise<POI[]> => {
  const response = await apiClient.post<POI[]>('/api/pois', { route });
  return response.data;
};