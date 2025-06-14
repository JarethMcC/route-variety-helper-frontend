// Describes a single Strava activity, as returned by our backend
export interface Activity {
  id: number;
  name: string;
  distance: number;
  type: string;
  start_date: string;
}

// Describes a single Point of Interest (POI)
export interface POI {
  name: string;
  type: string;
  coords: [number, number]; // [latitude, longitude]
  rating?: number;
  price_level?: number;
}

// Describes the raw GPS stream for a route
export type ActivityStream = [number, number][]; // Array of [latitude, longitude]