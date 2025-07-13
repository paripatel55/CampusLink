import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { sendEmailVerification } from "firebase/auth";
import { signOut } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import "./SignUp.css";

export default function SignUp({ onGoToSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

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

  const validatePassword = () => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include a letter, a number, and a symbol."
      );
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }

    setPasswordError(""); 
    return true;
  };

  const createUser = async (e) => {
    e.preventDefault();

    const school = getSchool(email);
    if (!school) {
      alert("Please sign up with a valid NYC school .edu email.");
      return;
    }

    if (!validatePassword()) return;

    try {
      // create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // save user record with needsProfile: true
      await setDoc(doc(db, "users", user.uid), {
        email,
        school,
        needsProfile: true,
        isCheckedIn: false,
        currentLocation: null,
        createdAt: serverTimestamp(),
      });

      // send email verification
      await sendEmailVerification(user);

      // sign out so user can't access app before verifying
      await signOut(auth);

      // show message and offer resend button
      setMessage(
        "Account created! A verification email has been sent to your inbox. Please verify before logging in."
      );
      setShowResend(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const resendVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setMessage("Verification email sent again. Please check your inbox.");
        setShowResend(false);
      } else {
        setMessage("No user logged in to resend verification email.");
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (message) {
    return (
      <div>
        <p>{message}</p>
        {showResend && (
          <button onClick={resendVerification}>Resend Verification Email</button>
        )}
        <button onClick={onGoToSignIn} style={{ marginTop: 16 }}>
          Go to Sign In
        </button>
      </div>
    );
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
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter Password"
        required
      />
      {passwordError && <p className="error-text">{passwordError}</p>}
      <button type="submit">Create Account</button>
    </form>
  );
}