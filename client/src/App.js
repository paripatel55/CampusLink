import React, { useState } from "react";
import LandingPage from "./components/LandingPage/LandingPage";
import HangoutRequestForm from "./components/HangoutRequestForm/HangoutRequestForm";
import ProfileSetup from "./components/ProfileSetup/ProfileSetup";
import UserProfile from "./components/UserProfile/UserProfile";
import HangoutRequestsList from "./components/HangoutRequestsList/HangoutRequestsList";
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false); 
  const [activePage, setActivePage] = useState("hangout");

  const handleLoginSuccess = (user, options) => {
    setUser(user);
    setNeedsProfile(options?.needsProfile || false);
    console.log("Successfully logged in. Handle profile completion here.", user, options);
  };

  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (needsProfile) {
    return (
      <ProfileSetup
        user={user}
        onComplete={() => setNeedsProfile(false)} 
      />
    );
  }

  return (
    <div className="App">
    {activePage === "hangout" && (
      <header className="app-header">
        <h1>Proxo</h1>
        <p>Find study buddies and hangout partners nearby!</p>
      </header>
    )}

    {/* Navigation bar */}
    <nav className="app-nav">
      <button
        className={activePage === "hangout" ? "active" : ""}
        onClick={() => setActivePage("hangout")}
      >
        Hangout Requests
      </button>
      <button
        className={activePage === "profile" ? "active" : ""}
        onClick={() => setActivePage("profile")}
      >
        Profile
      </button>
    </nav>

    <main className="app-main">
      {activePage === "hangout" && <HangourRequestList /> && <HangoutRequestForm />}
      {activePage === "profile" && <UserProfile user={user} />}
    </main>
  </div>
);
}