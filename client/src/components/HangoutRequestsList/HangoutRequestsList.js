import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
// TODO: Import needed Firestore functions

const HangoutRequestsList = () => {
  // TODO: Set up state for requests array and loading

  useEffect(() => {
    // TODO: Create Firestore query for active requests
    // TODO: Filter by status === 'active' and expiresAt > current time
    // TODO: Order by createdAt desc
    // TODO: Set up real-time listener with onSnapshot
    // TODO: Convert timestamps to Date objects
    // TODO: Update state and set loading to false
    // TODO: Return cleanup function
  }, []);

  // TODO: Function to calculate time remaining
  const getTimeRemaining = (expiresAt) => {
    // TODO: Compare expiresAt with current time
    // TODO: Return formatted string like "2h 30m left" or "Expired"
  };

  // TODO: Optional - Clean up expired requests
  useEffect(() => {
    // TODO: Check for expired requests and delete them
  }, [/* TODO: dependency array */]);

  // TODO: Show loading state
  if (false /* TODO: replace with loading condition */) {
    return <div>Loading hangout requests...</div>;
  }

  return (
    <div className="requests-container">
      <h2>Active Hangout Requests</h2>
      
      {/* TODO: Show message when no requests */}
      {/* TODO: Map through requests and create cards */}
      {/* Each card should show: summary, time remaining, location, duration, "Interested" button */}
    </div>
  );
};

export default HangoutRequestsList;
