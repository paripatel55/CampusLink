import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./SignIn.css";

export default function SignIn({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      if (!user.emailVerified) {
        setMessage("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }
        
      // get user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        setMessage("User profile not found. Please contact support.");
        return;
      }

      const userData = userDoc.data();
      if (userData.needsProfile) {
        // redirect or show profile completion UI
        onLoginSuccess(user, { needsProfile: true });
      } else {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setMessage("Email does not exist. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        setMessage("Incorrect password.");
      } else {
        setMessage(err.message);
      }
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <h2>Sign In</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
