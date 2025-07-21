/* global google */
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './HangoutRequestsList.css';

const HangoutRequestsList = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) { return; }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('Google Maps API loaded successfully for HangoutRequestsList');
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    // Only start fetching requests if user location is set
    if (!userLocation) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'hangoutRequests'),
      where('status', '==', 'active'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const listener = onSnapshot(q, (snapshot) => {
      const requestData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Skip documents with missing required fields
        if (!data.createdAt || !data.expiresAt) {
          return null;
        }

        const request = {
          id: doc.id,
          summary: data.summary,
          location: data.location,
          locationDetail: data.locationDetail,
          latitude: data.latitude,
          longitude: data.longitude,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt.toDate(),
        };

        // Calculate distance if both locations have coordinates
        if (userLocation && data.latitude && data.longitude) {
          request.distance = calculateDistance(
            userLocation.latitude, 
            userLocation.longitude, 
            data.latitude, 
            data.longitude
          );
        }

        return request;
      }).filter(request => request !== null);

      // Sort by distance (closest first)
      requestData.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        // Put requests without distance at the end
        if (a.distance && !b.distance) return -1;
        if (!a.distance && b.distance) return 1;
        return 0;
      });

      setRequests(requestData);
      setLoading(false);
    });

    return () => listener();
  }, [userLocation]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const getTimeRemaining = (expiresAt) => {
    const currentTime = new Date();
    const timeDiff = expiresAt.getTime() - currentTime.getTime();
    
    if (timeDiff <= 0) { return "Expired"; }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')} remaining`;
  };

  const handleGetUserLocation = async () => {
    setIsGettingUserLocation(true);
    setLocationMessage("Getting your precise location...");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log(`User location accuracy: ${accuracy} meters`);
          
          // Check if Google Maps is loaded
          if (!window.google || !window.google.maps) {
            setUserLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            setLocationMessage(`📍 Location detected (±${Math.round(accuracy)}m accuracy)`);
            setIsGettingUserLocation(false);
            return;
          }
          
          // Convert coordinates to readable address using Geocoder
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ 
            location: { lat: latitude, lng: longitude } 
          }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setUserLocation({
                latitude,
                longitude,
                address: results[0].formatted_address
              });
              setLocationMessage(`📍 Location detected! (±${Math.round(accuracy)}m accuracy)`);
            } else {
              console.error('Geocoding failed:', status);
              setUserLocation({
                latitude,
                longitude,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              });
              setLocationMessage(`📍 Location detected (±${Math.round(accuracy)}m accuracy)`);
            }
            setIsGettingUserLocation(false);
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "❌ ";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access denied. Please enable location permissions and try again.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information unavailable. Please try again.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please try again.";
              break;
            default:
              errorMessage += "Location access failed. Please try again.";
              break;
          }
          
          setLocationMessage(errorMessage);
          setIsGettingUserLocation(false);
        },
        // High precision geolocation options
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationMessage("❌ Location not supported by this browser.");
      setIsGettingUserLocation(false);
    }
  };

  // Show location prompt if user hasn't set location yet
  if (!userLocation) {
    return (
      <div className="requests-container">
        <h2>Active Hangout Requests</h2>
        
        <div className="location-setup">
          <p>📍 Set your location to see requests sorted by distance:</p>
          <button 
            onClick={handleGetUserLocation}
            disabled={isGettingUserLocation}
            className="location-btn"
          >
            {isGettingUserLocation ? "Getting Location..." : "📍 Get My Location"}
          </button>
          
          {locationMessage && (
            <p className={`location-message ${locationMessage.includes('❌') ? 'error' : 'success'}`}>
              {locationMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="requests-container">
        <div className="user-location-display">
          <p>📍 Your location: {userLocation.address}</p>
          <button onClick={() => setUserLocation(null)} className="change-location-btn">
            Change Location
          </button>
        </div>
        <div>Loading hangout requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="requests-container">
        <h2>Active Hangout Requests</h2>
        
        <div className="user-location-display">
          <p>📍 Your location: {userLocation.address}</p>
          <button onClick={() => setUserLocation(null)} className="change-location-btn">
            Change Location
          </button>
        </div>
        
        <p className="no-requests">No active hangout requests found. Be the first to post one!</p>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <h2>Active Hangout Requests</h2>
      
      <div className="user-location-display">
        <p>📍 Your location: {userLocation.address}</p>
        <button onClick={() => setUserLocation(null)} className="change-location-btn">
          Change Location
        </button>
      </div>
      
      <div className="requests-grid">
        {requests.map(request => (
          <div key={request.id} className="request-card">
            <div className="card-header">
              <h3 className="request-summary">{request.summary}</h3>
              <div className="card-badges">
                <span className="time-remaining">{getTimeRemaining(request.expiresAt)}</span>
                {request.distance && (
                  <span className="distance-badge">{request.distance} mi away</span>
                )}
              </div>
            </div>
            
            <div className="card-body">
              <div className="request-location">
                <span className="location-icon">📍</span>
                <span>{request.location}</span>
                {request.locationDetail && (
                  <div className="location-detail">{request.locationDetail}</div>
                )}
              </div>
            </div>
            
            <div className="card-footer">
              <button className="interested-btn">
                Interested
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HangoutRequestsList;