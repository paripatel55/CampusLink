/* global google */
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './HangoutRequests.css';

const HangoutRequestForm = () => {
  const initialFormData = {
      summary: "",
      duration: 15,
      location: "",
      locationDetails: "",
      latitude: null,
      longitude: null
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    if (window.google && window.google.maps) { return; }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('Google Maps API loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);
  }, []);

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setMessage("Getting your location...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Convert coordinates to address using Google Geocoding
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ 
            location: { lat: latitude, lng: longitude } 
          }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setFormData(prev => ({
                ...prev,
                latitude,
                longitude,
                location: results[0].formatted_address
              }));
              setSearchInput(""); // Clear search input
              setMessage(`📍 Location detected successfully!`);
            } else {
              console.error('Geocoding failed:', status);
              setFormData(prev => ({
                ...prev,
                latitude,
                longitude,
                location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
              setMessage(`📍 Location detected`);
            }
            setIsGettingLocation(false);
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
              errorMessage += "Location information unavailable. Please try again or search manually.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please try again or search manually.";
              break;
            default:
              errorMessage += "Location access failed. Please search manually below.";
              break;
          }
          
          setMessage(errorMessage);
          setIsGettingLocation(false);
        },
        // High precision geolocation options
        {
          enableHighAccuracy: true,      // Use GPS if available (mobile)
          timeout: 30000,                // Wait up to 30 seconds for precise location
          maximumAge: 60000              // Use cached location if less than 1 minute old
        }
      );
    } else {
      setMessage("❌ Location not supported by this browser. Please search manually below.");
      setIsGettingLocation(false);
    }
  };

  const handleLocationSearch = (inputValue) => {
    setSearchInput(inputValue);
    setSearchResults([]);
    if (inputValue.length < 3) { return; }

    setIsSearching(true);
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.textSearch({
      query: inputValue
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        setSearchResults(results.slice(0, 5)); // Limit to first 5 results
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    });
  };

  const selectPlace = (place) => {
    try {
      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      setFormData(prev => ({
        ...prev,
        location: place.formatted_address,
        latitude,
        longitude
      }));

      setSearchResults([]);
      setSearchInput("");
      setMessage("📍 Location selected!");
    } catch (error) {
      console.error('Error selecting place:', error);
      setMessage("Error selecting location. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const expireTime = new Date();
      expireTime.setMinutes(expireTime.getMinutes() + formData.duration);

      const hangoutRequest = {
        summary: formData.summary,
        duration: formData.duration,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationDetails: formData.locationDetails,
        createdAt: serverTimestamp(),
        expiresAt: expireTime,
        status: "active"
      };

      await addDoc(collection(db, 'hangoutRequests'), hangoutRequest);
      setMessage("Successfully posted request!");
      setFormData(initialFormData);
      setSearchInput("");
    } catch (error) {
      setMessage("Error: Failed to post request - " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hangout-form-container">
      <h2>Create Hangout Request</h2>
      
      {message && (
        <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="hangout-form">
        <div className="form-group">
          <label htmlFor="summary">What do you want to do?</label>
          <textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({...prev, summary: e.target.value}))}
            placeholder="e.g., Study for finals, grab coffee, play basketball..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration</label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value)}))}
            required
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location *</label>
          
          <button 
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="location-btn"
          >
            {isGettingLocation ? 'Getting Location...' : '📍 Use My Current Location'}
          </button>
          
          <div className="location-divider">— OR —</div>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a location (e.g., NYU Library, Central Park)..."
              value={searchInput}
              onChange={(e) => handleLocationSearch(e.target.value)}
              className="location-search-input"
            />
            
            {isSearching && (
              <div className="search-loading">Searching...</div>
            )}
            
            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((place, index) => (
                  <div 
                    key={index}
                    className="search-result-item"
                    onClick={() => selectPlace(place)}
                  >
                    <strong>{place.name}</strong>
                    <br />
                    <small>{place.formatted_address}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {formData.location && (
            <div className="location-display">
              <strong>📍 Selected Location: {formData.location}</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="locationDetails">Location specific details</label>
          <textarea
            id="locationDetails"
            value={formData.locationDetails}
            onChange={(e) => setFormData(prev => ({...prev, locationDetails: e.target.value}))}
            placeholder="e.g., Study Room Number, common area, ..."
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !formData.location || !formData.summary.trim()}
          className="submit-btn"
        >
          {isSubmitting ? 'Posting...' : 'Post Hangout Request'}
        </button>
        
        {(!formData.summary.trim() || !formData.location) && (
          <div className="requirement-messages">
            {!formData.summary.trim() && (
              <p className="requirement-message">
                ✏️ Please describe what you want to do
              </p>
            )}
            {!formData.location && (
              <p className="requirement-message">
                📍 Please set your location before submitting
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default HangoutRequestForm;