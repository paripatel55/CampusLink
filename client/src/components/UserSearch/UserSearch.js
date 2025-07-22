import React, { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function UserSearch() {
    const [school, setSchool] = useState("NYU");  
    const [year, setYear] = useState("");
    const [interests, setInterests] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
    setLoading(true);

    try {
        let usersRef = collection(db, "users");
        let constraints = [];

        if (school) constraints.push(where("school", "==", school));
        if (year) constraints.push(where("schoolYear", "==", year));

        const q = query(usersRef, ...constraints);
        const querySnapshot = await getDocs(q);

        let users = [];
        querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
        });

        if (interests.trim()) {
        const searchInterests = interests.toLowerCase().split(",").map(i => i.trim());
        users = users.filter(user =>
            user.interests &&
            user.interests.some(i => searchInterests.includes(i.toLowerCase()))
        );
        }

        setResults(users);
    } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
    }
    setLoading(false);
    };

    return (
    <div className="user-search">
        <h2>Search Users</h2>
        <div>
        <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            style={{ marginRight: 8 }}
        >
            <option value="NYU">NYU</option>
        </select>

        <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ marginRight: 8 }}
        >
            <option value="">Select Year</option>
            <option value="Freshman">Freshman</option>
            <option value="Sophomore">Sophomore</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Graduate">Graduate</option>
        </select>

        <input
            type="text"
            placeholder="Interests (comma separated)"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            style={{ marginRight: 8 }}
        />

        <button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
        </button>
        </div>

        <div style={{ marginTop: 20 }}>
        {results.length === 0 && !loading && <p>No users found.</p>}
        {results.map((user) => (
            <div
            key={user.id}
            style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #ccc",
                padding: "8px 0",
                gap: "12px",
            }}
            >
            <img
                src={user.photoURL || "/default-profile-pic.png"}
                alt={`${user.name || "User"}'s profile`}
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
            />
            <div>
                <strong>{user.name || "No Name"}</strong> (@{user.username})<br />
                School: {user.school || "N/A"} | Year: {user.schoolYear || "N/A"}<br />
                Interests: {user.interests ? user.interests.join(", ") : "None"}
            </div>
            </div>
         ))}
        </div>
    </div>
    );
}
