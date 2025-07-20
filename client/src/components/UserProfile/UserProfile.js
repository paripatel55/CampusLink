import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import "./UserProfile.css";

export default function UserProfile({ user }) {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        {/* Profile Picture Section */}
        <div className="profile-picture-container">
          <label htmlFor="photo-upload">
            <img
              src={profile.photoURL || "/default-profile-pic.png"}
              alt="Profile"
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

        {/* Profile Info Section */}
        <div className="profile-info">
          <div className="profile-top-row">
            <div className="profile-username">@{profile.username}</div>
            <button className="edit-profile-btn">Edit Profile</button>
          </div>

          <div className="profile-stats">
            <div className="stat-item">0 Friends</div> 
            <div className="stat-item">0 Hangouts</div> 
          </div>

          <div className="profile-bio">
            <div className="profile-name">{profile.name || "No name provided"}</div>
            <div className="profile-details"><strong>School:</strong> {profile.school}</div>
            <div className="profile-details"><strong>Year:</strong> {profile.schoolYear || "Not specified"}</div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="profile-interests">
                <strong>Interests:</strong> {profile.interests.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

