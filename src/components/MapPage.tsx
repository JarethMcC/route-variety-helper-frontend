import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { getActivityStream, findPOIs } from '../services/api';
import { ActivityStream, POI } from '../types';

// Constants for map styling and configuration
const MAP_STYLES = {
  strokeColor: '#fc4c02',
  strokeOpacity: 0.8,
  strokeWeight: 4,
  defaultCenter: { lat: 51.5074, lng: -0.1278 }, // London as fallback
  defaultZoom: 13,
};

// POI type categories for filtering
const POI_CATEGORIES = [
  'All',
  'restaurant',
  'tourist_attraction',
  'lodging',
  'gas_station',
  'store',
  'hospital',
  'bank',
  'other',
] as const;

// Helper function to calculate route statistics
const calculateRouteStats = (route: ActivityStream) => {
  if (route.length < 2) return { distance: 0, elevationGain: 0 };
  
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    const [lat1, lng1] = route[i - 1];
    const [lat2, lng2] = route[i];
    
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    totalDistance += R * c;
  }
  
  return { distance: totalDistance, elevationGain: 0 }; // Elevation gain would need elevation data
};

// Error boundary component for better error handling
const ErrorMessage: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>Something went wrong</h3>
    <p>{error}</p>
    {onRetry && (
      <button onClick={onRetry} className="button-strava">
        Try Again
      </button>
    )}
  </div>
);

// Loading component with better UX
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// POI Info Window component
const POIInfoWindow: React.FC<{
  poi: POI;
  onClose: () => void;
}> = ({ poi, onClose }) => (
  <InfoWindow
    position={{ lat: poi.coords[0], lng: poi.coords[1] }}
    onCloseClick={onClose}
  >
    <div className="poi-info">
      <h4>{poi.name}</h4>
      <div className="poi-details">
        <span className="poi-type">{poi.type.replace('_', ' ')}</span>
        {poi.rating && (
          <div className="poi-rating">
            <span className="rating-stars">
              {'★'.repeat(Math.floor(poi.rating))}
              {'☆'.repeat(5 - Math.floor(poi.rating))}
            </span>
            <span className="rating-value">({poi.rating.toFixed(1)})</span>
          </div>
        )}
        {poi.price_level && (
          <div className="poi-price">
            Price: {'$'.repeat(poi.price_level)}
          </div>
        )}
      </div>
    </div>
  </InfoWindow>
);

// Route Statistics component
const RouteStats: React.FC<{ route: ActivityStream; poisCount: number }> = ({ route, poisCount }) => {
  const stats = useMemo(() => calculateRouteStats(route), [route]);
  
  return (
    <div className="route-stats">
      <div className="stat-item">
        <span className="stat-label">Distance:</span>
        <span className="stat-value">{stats.distance.toFixed(1)} km</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Route Points:</span>
        <span className="stat-value">{route.length.toLocaleString()}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">POIs Found:</span>
        <span className="stat-value">{poisCount}</span>
      </div>
    </div>
  );
};

// POI Filter component
const POIFilter: React.FC<{
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  poisByCategory: Record<string, number>;
}> = ({ selectedCategory, onCategoryChange, poisByCategory }) => (
  <div className="poi-filter">
    <label htmlFor="poi-category-select">Filter POIs:</label>
    <select
      id="poi-category-select"
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value)}
      className="poi-select"
    >
      {POI_CATEGORIES.map(category => (
        <option key={category} value={category}>
          {category === 'All' ? 'All Types' : category.replace('_', ' ')}
          {category !== 'All' && ` (${poisByCategory[category] || 0})`}
        </option>
      ))}
    </select>
  </div>
);

// Map Content component that uses useMap hook
const MapContent: React.FC<{
  route: ActivityStream;
  filteredPois: POI[];
  selectedPoi: POI | null;
  onMarkerClick: (poi: POI) => void;
  onInfoWindowClose: () => void;
}> = ({ route, filteredPois, selectedPoi, onMarkerClick, onInfoWindowClose }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const hasFitBoundsRef = useRef(false);
  
  // Initial bounds fitting - only runs once when map and route are first available
  useEffect(() => {
    if (!map || !route || route.length === 0 || hasFitBoundsRef.current) return;
    
    const bounds = new google.maps.LatLngBounds();
    route.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 20); // Reduced padding for tighter fit
    hasFitBoundsRef.current = true;
  }, [map, route]);
  
  // Route polyline drawing - separate from bounds fitting
  useEffect(() => {
    if (!map || !route || route.length === 0) return;
    
    // Clean up existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    
    // Create new polyline
    polylineRef.current = new google.maps.Polyline({
      path: route.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: MAP_STYLES.strokeColor,
      strokeOpacity: MAP_STYLES.strokeOpacity,
      strokeWeight: MAP_STYLES.strokeWeight,
    });
    
    polylineRef.current.setMap(map);
    
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, route]);
  
  return (
    <>
      {filteredPois.map((poi, index) => (
        <Marker
          key={`${poi.coords[0]}-${poi.coords[1]}-${index}`}
          position={{ lat: poi.coords[0], lng: poi.coords[1] }}
          onClick={() => onMarkerClick(poi)}
          title={`${poi.name} (${poi.type})`}
        />
      ))}
      
      {selectedPoi && (
        <POIInfoWindow
          poi={selectedPoi}
          onClose={onInfoWindowClose}
        />
      )}
    </>
  );
};
const MapPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [route, setRoute] = useState<ActivityStream | null>(null);
  const [allPois, setAllPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Memoized calculations
  const filteredPois = useMemo(() => {
    if (selectedCategory === 'All') return allPois;
    return allPois.filter(poi => poi.type === selectedCategory);
  }, [allPois, selectedCategory]);
  
  const poisByCategory = useMemo(() => {
    return allPois.reduce((acc, poi) => {
      acc[poi.type] = (acc[poi.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allPois]);
  
  const mapCenter = useMemo(() => {
    if (!route || route.length === 0) return MAP_STYLES.defaultCenter;
    return { lat: route[0][0], lng: route[0][1] };
  }, [route]);
  
  // Event handlers
  const handleRetry = useCallback(async () => {
    if (!activityId) return;
    
    setIsRetrying(true);
    setError('');
    
    try {
      const stream = await getActivityStream(Number(activityId));
      if (stream.length === 0) {
        setError('This activity has no GPS data to display.');
        return;
      }
      setRoute(stream);
      
      const foundPois = await findPOIs(stream);
      setAllPois(foundPois);
    } catch (err) {
      setError('Failed to load activity data. Please check your connection and try again.');
      console.error('Error loading activity data:', err);
    } finally {
      setIsRetrying(false);
    }
  }, [activityId]);
  
  const handleMarkerClick = useCallback((poi: POI) => {
    setSelectedPoi(poi);
  }, []);
  
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);
  
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    setSelectedPoi(null); // Close any open info window
  }, []);
  
  // Initial data loading
  useEffect(() => {
    if (!activityId) {
      setError('Invalid activity ID');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const stream = await getActivityStream(Number(activityId));
        if (stream.length === 0) {
          setError('This activity has no GPS data to display.');
          return;
        }
        setRoute(stream);
        
        const foundPois = await findPOIs(stream);
        setAllPois(foundPois);
      } catch (err) {
        setError('Failed to load activity data. Please check your connection and try again.');
        console.error('Error loading activity data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activityId]);
  
  // Handle invalid activity ID
  if (!activityId) {
    return (
      <div className="container">
        <ErrorMessage 
          error="Invalid activity ID" 
          onRetry={() => navigate('/activities')}
        />
      </div>
    );
  }
  
  // Loading state
  if (loading || isRetrying) {
    return (
      <div className="container">
        <LoadingSpinner message={isRetrying ? "Retrying..." : "Loading route and discovering points of interest..."} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container">
        <Link to="/activities" className="back-link">
          ← Back to Activities
        </Link>
        <ErrorMessage error={error} onRetry={handleRetry} />
      </div>
    );
  }
  
  // Main render
  return (
    <div className="map-page">
      <div className="map-header">
        <Link to="/activities" className="back-link">
          ← Back to Activities
        </Link>
        <h2>Activity Route Explorer</h2>
        
        {route && (
          <RouteStats route={route} poisCount={filteredPois.length} />
        )}
        
        {allPois.length > 0 && (
          <POIFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            poisByCategory={poisByCategory}
          />
        )}
      </div>
      
      <div className="map-container">
        <Map
          defaultCenter={mapCenter}
          defaultZoom={MAP_STYLES.defaultZoom}
          mapId="ROUTE_VARIETY_MAP"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={true}
          scaleControl={true}
          streetViewControl={false}
          rotateControl={false}
          fullscreenControl={true}
        >
          {route && (
            <MapContent
              route={route}
              filteredPois={filteredPois}
              selectedPoi={selectedPoi}
              onMarkerClick={handleMarkerClick}
              onInfoWindowClose={handleInfoWindowClose}
            />
          )}
        </Map>
      </div>
      
      {filteredPois.length === 0 && allPois.length > 0 && (
        <div className="no-results">
          <p>No points of interest found for the selected category.</p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="button-strava"
          >
            Show All POIs
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPage;
