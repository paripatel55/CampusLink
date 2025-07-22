import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import "./UserProfile.css";


export default function UserProfile({ user }) {
    const [profile, setProfile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({});
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
    async function fetchProfile() {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
        setProfile(docSnap.data());
        }
    }
    fetchProfile();
    }, [user]);

    const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploading(true);

    try {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { photoURL: downloadURL });

        setProfile((prev) => ({ ...prev, photoURL: downloadURL }));
    } catch (err) {
        console.error("Photo upload failed:", err.message);
    }

    setUploading(false);
    };

    const validateUsername = (username) => {
    const normalized = username.trim().toLowerCase();
    const regex = /^[a-z0-9._]+$/;
    if (normalized.length < 4) return "Username must be at least 4 characters long.";
    if (normalized.length > 30) return "Username cannot be longer than 30 characters.";
    if (!regex.test(normalized)) return "Username can only contain lowercase letters, numbers, dots, and underscores.";
    return "";
    };

    const checkUsernameAvailability = async (username) => {
    const normalized = username.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", normalized));
    const snapshot = await getDocs(q);
    return snapshot.empty || normalized === profile.username;
    };

    const handleDone = async () => {
    setSaving(true);
    setError("");

    const usernameError = validateUsername(tempProfile.username);
    if (usernameError) {
        setError(usernameError);
        setSaving(false);
        return;
    }

    const available = await checkUsernameAvailability(tempProfile.username);
    if (!available) {
        setError("Username already taken. Please choose another.");
        setSaving(false);
        return;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
        name: tempProfile.name,
        username: tempProfile.username,
        interests: tempProfile.interests.split(",").map((i) => i.trim()),
        schoolYear: tempProfile.schoolYear
        });

        setProfile((prev) => ({
        ...prev,
        name: tempProfile.name,
        username: tempProfile.username,
        interests: tempProfile.interests.split(",").map((i) => i.trim()),
        schoolYear: tempProfile.schoolYear
        }));

        setEditing(false);
    } catch (err) {
        setError("Failed to save: " + err.message);
    }

    setSaving(false);
    };

    if (!profile) return <div>Loading profile...</div>;

    return (
    <div className="profile-container">
        <div className="profile-header">
        <div className="profile-picture-container">
            <label htmlFor="photo-upload">
            <img
                src={profile.photoURL || "/default-profile-pic.png"}
                alt="upload profile pic"
                className="profile-picture"
                style={{ cursor: "pointer" }}
                title="Click to change profile photo"
            />
            </label>
            <input
            type="file"
            id="photo-upload"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoChange}
            />
            {uploading && <p className="uploading-text">Uploading...</p>}
        </div>

        <div className="profile-info">
            <div className="profile-top-row">
            <div className="profile-username">
                {editing ? (
                <input
                    type="text"
                    value={tempProfile.username}
                    onChange={(e) => setTempProfile((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase()
                    }))}
                />
                ) : (
                `@${profile.username}`
                )}
            </div>

            {editing ? (
                <button className="edit-profile-btn" onClick={handleDone} disabled={saving}>
                {saving ? "Saving..." : "Done"}
                </button>
            ) : (
                <button
                className="edit-profile-btn"
                onClick={() => {
                    setTempProfile({
                    name: profile.name || "",
                    username: profile.username || "",
                    interests: (profile.interests || []).join(", "),
                    schoolYear: profile.schoolYear || ""
                    });
                    setEditing(true);
                    setError("");
                }}
                >
                Edit Profile
                </button>
            )}
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="profile-stats">
            <div className="stat-item">0 Friends</div>
            <div className="stat-item">0 Hangouts</div>
            </div>

            <div className="profile-bio">
            {editing ? (
                <>
                <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile((prev) => ({
                    ...prev,
                    name: e.target.value
                    }))}
                    placeholder="Full Name"
                />

                <input
                    type="text"
                    value={tempProfile.interests}
                    onChange={(e) => setTempProfile((prev) => ({
                    ...prev,
                    interests: e.target.value
                    }))}
                    placeholder="Interests (comma separated)"
                />

                <select
                    value={tempProfile.schoolYear}
                    onChange={(e) => setTempProfile((prev) => ({
                    ...prev,
                    schoolYear: e.target.value
                    }))}
                >
                    <option value="">Select Year</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                </select>
                </>
            ) : (
                <>
                <div className="profile-name">
                    {profile.name || "No name provided"}
                </div>
                <div className="profile-details">
                    <strong>School:</strong> {profile.school}
                </div>
                <div className="profile-details">
                    <strong>Year:</strong> {profile.schoolYear || "Not specified"}
                </div>
                {profile.interests && profile.interests.length > 0 && (
                    <div className="profile-interests">
                    <strong>Interests:</strong> {profile.interests.join(", ")}
                    </div>
                )}
                </>
            )}
            </div>
        </div>
        </div>
    </div>
    );
}
