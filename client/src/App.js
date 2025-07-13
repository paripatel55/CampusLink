import React, { useState } from "react";
import LandingPage from "./LandingPage/LandingPage";
import HangoutRequestForm from "./HangoutRequestForm";
// import HangoutRequestsList from "./HangoutRequestsList";
import './App.css';
import './HangoutRequests.css';

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (user, options) => {
    setUser(user);
    console.log("Successfully logged in. Handle profile completion here.", user, options);
  };

  if (!user) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>CampusLink</h1>
        <p>Find study buddies and hangout partners nearby!</p>
      </header>

      <main className="app-main">
        <HangoutRequestForm />
        {/* <HangoutRequestsList /> */}
      </main>
    </div>
  );
}

