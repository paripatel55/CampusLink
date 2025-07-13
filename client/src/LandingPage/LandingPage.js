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
        <div class="landing-container">
          <h1>Welcome to Proxo</h1>
          <div class="landing-buttons">
            <button onClick={() => setPage("signIn")}>Log In</button>
            <button onClick={() => setPage("signUp")}>Create Account</button>
          </div>
        </div>
      );
    }
  };

  return <div>{renderContent()}</div>;
}