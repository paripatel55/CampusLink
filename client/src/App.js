import React, { useState } from "react";
import LandingPage from "./LandingPage/LandingPage";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (user, options) => {
    setUser(user);
    console.log("Successfully logged in. Handle profile completion here.", user, options);
  };

  if (user) {
    return (
      <div>
        <h2>Welcome, {user.email}!</h2>
      </div>
    );
  }

  return <LandingPage onLoginSuccess={handleLoginSuccess} />;
}
