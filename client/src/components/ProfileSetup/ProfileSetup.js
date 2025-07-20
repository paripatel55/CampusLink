import React, { useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";


export default function ProfileSetup({ user, onComplete }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [schoolYear, setSchoolYear] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    if (!name || !username) {
        setError("Name and username are required.");
        setIsSaving(false);
        return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const validUsernameRegex = /^[a-z0-9._]+$/;

    if (normalizedUsername.length < 4) {
        setError("Username must be at least 4 characters long.");
        setIsSaving(false);
        return;
    }

    if (normalizedUsername.length > 30) {
        setError("Username cannot be longer than 30 characters.");
        setIsSaving(false);
        return;
    }

    if (!validUsernameRegex.test(normalizedUsername)) {
        setError("Username can only contain lowercase letters, numbers, dots, and underscores.");
        setIsSaving(false);
        return;
    }

    try {
        // check if username already taken 
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", normalizedUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setError("Username already taken. Please choose another.");
            setIsSaving(false);
            return;
        }

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name,
            username,
            interests: interests.split(",").map((i) => i.trim()),
            schoolYear: user.schoolYear || "Freshman",
            needsProfile: false,
        });

        onComplete(); // Go to main app after success
        } catch (err) {
            console.error(err);
            setError("Failed to save profile: " + err.message);
        }

        setIsSaving(false);
    };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Complete Your Profile</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Username (letters, symbols (_.), 0-9)"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase())}
        required
      />

      <input
        type="text"
        placeholder="Interests (e.g., art, tech, fitness)"
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
      />

      <select
        value={schoolYear}
        onChange={(e) => setSchoolYear(e.target.value)}
        required
        style={{ marginBottom: "16px", padding: "10px" }}
        >
        <option value="">Select Year</option>
        <option value="Freshman">Freshman</option>
        <option value="Sophomore">Sophomore</option>
        <option value="Junior">Junior</option>
        <option value="Senior">Senior</option>
        <option value="Graduate">Graduate</option>
      </select>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
