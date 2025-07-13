import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const HangoutRequestForm = () => {
  const initialFormData = {
      summary: "",
      duration: 15,
      location: "",
      latitude: null,
      longitude: null
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // TODO: Load Google Maps JavaScript API on component mount
  useEffect(() => {
    // TODO: Add Google Maps script tag to document head
    // TODO: Set up Google Maps API with your API key
    // TODO: Initialize geocoding service for coordinate-to-address conversion
  }, []);

  // TODO: Function to get user location using Google Maps Geolocation API
  const handleGetLocation = async () => {
    // TODO: Check if geolocation is supported
    // TODO: Request user permission for location access
    // TODO: Use Google Maps Geolocation API for enhanced accuracy
    // TODO: Convert coordinates to readable address using Geocoding API
    // TODO: Update formData with latitude, longitude, and formatted address
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const expireTime = new Date();
      expireTime.setMinutes(expireTime.getMinutes() + formData.duration);

      /* TODO: maybe add information about person creating request as metadata 
        so requests do not reappear on their side / have a special box for
        your own request? */

      const hangoutRequest = {
        summary: formData.summary,
        duration: formData.duration,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,

        createdAt: serverTimestamp(),
        expiresAt: expireTime,
        status: "active"
      };

      await addDoc(collection(db, 'hangoutRequests'), hangoutRequest);
      setMessage("Succesfully posted request")
      setFormData(initialFormData);
    } catch (error) {
      setMessage("Error: Failed to post request - " + error.message)
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hangout-form-container">
      <h2>Create Hangout Request</h2>
      
      {/* Show success/error messages */}
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="hangout-form">
        {/* Summary textarea field */}
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

        {/* Duration select field */}
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

        {/* Location button field */}
        <div className="form-group">
          <label>Location *</label>
          <button 
            type="button"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
            className="location-btn"
          >
            {isGettingLocation ? 'Getting Location...' : '📍 Get My Current Location'}
          </button>
          
          {/* Temporary manual input for testing */}
          <input
            type="text"
            placeholder="Or manually enter location for testing..."
            value={formData.location}
            onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
            className="temp-location-input"
          />
          
          {/* Show detected location */}
          {formData.location && (
            <div className="location-display">
              <strong>📍 Selected Location: {formData.location}</strong>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button 
          type="submit" 
          disabled={isSubmitting || !formData.location}
          className="submit-btn"
        >
          {isSubmitting ? 'Posting...' : 'Post Hangout Request'}
        </button>
        
        {/* Show requirement message if location not set */}
        {!formData.location && (
          <p className="requirement-message">
            📍 Please set your location before submitting
          </p>
        )}
      </form>
    </div>
  );
};

export default HangoutRequestForm;
