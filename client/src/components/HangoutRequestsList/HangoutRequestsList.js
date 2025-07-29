/* global google */
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './HangoutRequestsList.css';

const HangoutRequestsList = ({ user }) => {
  const [requests, setRequests] = useState([])
  const [userRequests, setUserRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingUserLocation, setIsGettingUserLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [cancelling, setCancelling] = useState(null);

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
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const username = profileData.username;
          
          const userRequestsQuery = query(
            collection(db, 'hangoutRequests'),
            where('createdBy', '==', username),
            where('status', '==', 'active'),
            where('expiresAt', '>', new Date()),
            orderBy('expiresAt', 'desc'),
            orderBy('createdAt', 'desc')
          );

          const userRequestsListener = onSnapshot(userRequestsQuery, (snapshot) => {
            const userRequestData = snapshot.docs.map(doc => {
              const data = doc.data();
              
              if (!data.createdAt || !data.expiresAt) {
                return null;
              }

              return {
                id: doc.id,
                summary: data.summary,
                location: data.location,
                locationDetails: data.locationDetails,
                latitude: data.latitude,
                longitude: data.longitude,
                createdBy: data.createdBy,
                createdByEmail: data.createdByEmail,
                duration: data.duration,
                createdAt: data.createdAt.toDate(),
                expiresAt: data.expiresAt.toDate(),
              };
            }).filter(request => request !== null);

            setUserRequests(userRequestData);
          });

          return userRequestsListener;
        }
      } catch (error) {
        console.error("Error fetching user profile or requests:", error);
      }
    };

    let unsubscribe;
    fetchUserProfile().then((listener) => {
      unsubscribe = listener;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!userLocation) {
      setLoading(false);
      return;
    }

    const fetchOtherRequests = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          const username = profileData.username;
          
          const q = query(
            collection(db, 'hangoutRequests'),
            where('status', '==', 'active'),
            where('expiresAt', '>', new Date()),
            where('createdBy', '!=', username), 
            orderBy('createdBy'),
            orderBy('expiresAt', 'desc'),
            orderBy('createdAt', 'desc')
          );

          const listener = onSnapshot(q, (snapshot) => {
            const requestData = snapshot.docs.map(doc => {
              const data = doc.data();
              
              if (!data.createdAt || !data.expiresAt) {
                return null;
              }

              const request = {
                id: doc.id,
                summary: data.summary,
                location: data.location,
                locationDetails: data.locationDetails,
                latitude: data.latitude,
                longitude: data.longitude,
                createdBy: data.createdBy,
                createdByEmail: data.createdByEmail,
                duration: data.duration,
                createdAt: data.createdAt.toDate(),
                expiresAt: data.expiresAt.toDate(),
              };

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

            requestData.sort((a, b) => {
              if (a.distance && b.distance) {
                return a.distance - b.distance;
              }
              if (a.distance && !b.distance) return -1;
              if (!a.distance && b.distance) return 1;
              return 0;
            });

            setRequests(requestData);
            setLoading(false);
          });

          return listener;
        }
      } catch (error) {
        console.error("Error fetching other requests:", error);
        setLoading(false);
      }
    };

    let unsubscribe;
    fetchOtherRequests().then((listener) => {
      unsubscribe = listener;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userLocation, user]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 3959; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; 
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

  const handleCancelRequest = async (requestId) => {
    setCancelling(requestId);
    try {
      await updateDoc(doc(db, 'hangoutRequests', requestId), {
        status: 'cancelled'
      });
      console.log('Request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
    } finally {
      setCancelling(null);
    }
  };

  const toggleRequestDetails = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  return (
    <div className="requests-container">
      <h2>Hangout Requests</h2>
      
      {/* Your Requests Section - Always visible */}
      <div className="your-requests-section">
        <h3>🏠 Your Requests</h3>
        {userRequests.length > 0 ? (
          <div className="requests-grid">
            {userRequests.map(request => (
              <div key={request.id} className="request-card your-request">
                <div className="card-header">
                  <h4 className="request-summary">{request.summary}</h4>
                  <div className="card-badges">
                    <span className="time-remaining">{getTimeRemaining(request.expiresAt)}</span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="request-location">
                    <span className="location-icon">📍</span>
                    <span>{request.location}</span>
                  </div>
                  
                  <div className="request-meta">
                    <p className="duration">⏱️ Duration: {request.duration} minutes</p>
                  </div>

                  {expandedRequest === request.id && (
                    <div className="request-details">
                      {request.locationDetails && (
                        <div className="location-details">
                          <strong>📍 Location Details:</strong>
                          <p>{request.locationDetails}</p>
                        </div>
                      )}
                      <div className="request-timing">
                        <p><strong>⏰ Posted:</strong> {request.createdAt.toLocaleString()}</p>
                        <p><strong>⏳ Expires:</strong> {request.expiresAt.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="card-footer">
                  <button 
                    className="cancel-request-btn"
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={cancelling === request.id}
                  >
                    {cancelling === request.id ? "Cancelling..." : "❌ Cancel Request"}
                  </button>
                  <button 
                    className="details-btn"
                    onClick={() => toggleRequestDetails(request.id)}
                  >
                    {expandedRequest === request.id ? "Hide Details" : "Show Details"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-requests">You haven't created any requests yet.</p>
        )}
      </div>

      {/* Divider */}
      <div className="section-divider"></div>

      {/* Other Requests Section - Location-based */}
      <div className="other-requests-section">
        <h3>🌍 Nearby Requests</h3>
        
        {!userLocation ? (
          <div className="location-setup">
            <p>📍 Set your location to see nearby requests:</p>
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
        ) : (
          <>
            <div className="user-location-display">
              <p>📍 Your location: {userLocation.address}</p>
              <button onClick={() => setUserLocation(null)} className="change-location-btn">
                Change Location
              </button>
            </div>
            
            {loading ? (
              <div>Loading nearby requests...</div>
            ) : requests.length === 0 ? (
              <p className="no-requests">No nearby hangout requests found.</p>
            ) : (
              <div className="requests-grid">
                {requests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="card-header">
                      <h4 className="request-summary">{request.summary}</h4>
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
                      </div>
                      
                      <div className="request-meta">
                        <p className="created-by">👤 By: {request.createdBy}</p>
                        <p className="duration">⏱️ Duration: {request.duration} minutes</p>
                      </div>

                      {expandedRequest === request.id && (
                        <div className="request-details">
                          {request.locationDetails && (
                            <div className="location-details">
                              <strong>📍 Location Details:</strong>
                              <p>{request.locationDetails}</p>
                            </div>
                          )}
                          <div className="request-timing">
                            <p><strong>⏰ Posted:</strong> {request.createdAt.toLocaleString()}</p>
                            <p><strong>⏳ Expires:</strong> {request.expiresAt.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer">
                      <button 
                        className="interested-btn"
                        onClick={() => toggleRequestDetails(request.id)}
                      >
                        {expandedRequest === request.id ? "Hide Details" : "👋 Interested"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HangoutRequestsList;