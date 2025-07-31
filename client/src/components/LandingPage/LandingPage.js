import React, { useState } from "react";
import SignIn from "../SignIn/SignIn";
import SignUp from "../Signup/SignUp";
import "./LandingPage.css";

export default function LandingPage({ onLoginSuccess }) {
  const [page, setPage] = useState(null); // null, "signIn", or "signUp"

  const handleGoToSignIn = () => setPage("signIn");

  const renderContent = () => {
    if (page === "signIn") {
      return <SignIn onLoginSuccess={onLoginSuccess} />;
    } else if (page === "signUp") {
      return <SignUp onGoToSignIn={handleGoToSignIn} />;
    } else {
      return (
        <div className="landing-container">
        <div className="landing-content">
          <h1>Proxo</h1>
          <p className="landing-subtitle">Discover. Connect. Adventure Nearby.</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍕</div>
              <div className="feature-text">
                <h3>Grab Food</h3>
                <p>Find dining buddies nearby</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <div className="feature-text">
                <h3>Share Hobbies</h3>
                <p>Connect over your passions</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏃</div>
              <div className="feature-text">
                <h3>Get Active</h3>
                <p>Find workout partners</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">☕</div>
              <div className="feature-text">
                <h3>Coffee & Chill</h3>
                <p>Casual meetups & conversations</p>
              </div>
            </div>
          </div>

          <div className="landing-buttons">
            <button onClick={() => setPage("signIn")}>Discover Now</button>
            <button onClick={() => setPage("signUp")}>Join Proxo</button>
          </div>
        </div>

        <div className="landing-visual">
          <div className="cosmic-orb orb-1"></div>
          <div className="cosmic-orb orb-2"></div>
          <div className="cosmic-orb orb-3"></div>
          
          <div className="connection-hub">
            <div className="activity-avatar">🍕</div>
            <div className="activity-avatar">🎮</div>
            <div className="activity-avatar">🏃</div>
            <div className="activity-avatar">☕</div>
            
            <div className="connection-line line-horizontal"></div>
            <div className="connection-line line-vertical"></div>
            <div className="connection-line line-diagonal"></div>
          </div>
          
          <div className="activity-bubble bubble-1">"Found my crew!"</div>
          <div className="activity-bubble bubble-2">"Best hangouts ever"</div>
          <div className="activity-bubble bubble-3">"Amazing connections!"</div>
        </div>
      </div>
      );
    }
  };

  return <div>{renderContent()}</div>;
}