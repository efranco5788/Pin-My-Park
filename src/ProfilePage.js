import React from "react";
import { auth } from "./firebaseConfig";
import { signOut, deleteUser } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./LoginPage.css"; // Reuse same clean card styles

function ProfilePage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Error logging out. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account?")) {
      try {
        await deleteUser(auth.currentUser);
        alert("Your account has been deleted.");
        navigate("/login");
      } catch (error) {
        console.error("Delete account error:", error);
        if (error.code === "auth/requires-recent-login") {
          alert("Please log in again before deleting your account.");
          navigate("/login");
        } else {
          alert("Error deleting account. Please try again later.");
        }
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card text-center">
        <h1 className="login-title">Your Profile</h1>
        <p className="login-subtitle mb-4">
          Manage your personal info and app history
        </p>

        {user ? (
          <div className="profile-info">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="User avatar"
                className="profile-avatar"
              />
            )}

            <p className="profile-text">
              <strong>Name:</strong> {user.displayName || "N/A"}
            </p>
            <p className="profile-text">
              <strong>Email:</strong> {user.email}
            </p>

            <div className="profile-actions mt-4">
              <Link to="/history" className="secondary-button">
                View Parking History
              </Link>

              <button
                onClick={handleDeleteAccount}
                className="danger-button mt-3"
              >
                Delete Account
              </button>

              <button onClick={handleLogout} className="primary-button mt-4">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <p className="login-subtitle">You are not logged in.</p>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;