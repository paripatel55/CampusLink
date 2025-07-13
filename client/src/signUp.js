import React, { useState } from "react";
import { auth, db } from "./firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { sendEmailVerification } from "firebase/auth";
import { signOut } from "firebase/auth";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function getSchool(email) {
    const domain = email.split("@")[1]?.toLowerCase();
    const allowedDomains = {
      "nyu.edu": "NYU",
      "columbia.edu": "Columbia",
      "barnard.edu": "Barnard",
      "fordham.edu": "Fordham",
      "baruch.cuny.edu": "Baruch",
      "hunter.cuny.edu": "Hunter",
      "brooklyn.cuny.edu": "Brooklyn",
    };
    return allowedDomains[domain] || null;
  }

  const createUser = async (e) => {
    e.preventDefault();

    const school = getSchool(email);
    if (!school) {
      alert("Please sign up with a valid NYC school .edu email.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await sendEmailVerification(user);

      // sign out user so they can't access app before verification
      await signOut(auth);

      setMessage(
        "Account created! A verification email has been sent to your inbox. Please verify before logging in."
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (message) {
    return <div>{message}</div>; // show verify email message 
  }

  return (
    <form onSubmit={createUser}>
      <h2>Sign Up</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
        placeholder="Email (.edu only)"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Create Account</button>
    </form>
  );
}