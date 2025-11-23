import React, { useState } from "react";
import { auth } from "./firebaseConfig";
import {
  signOut,
  deleteUser,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./ProfilePage.css";

function ProfilePage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [newPhoto, setNewPhoto] = useState(user?.photoURL || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Permanently delete your account?")) return;

    try {
      await deleteUser(auth.currentUser);
      alert("Account deleted.");
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        alert("Please sign in again first.");
        navigate("/login");
      } else alert("Error deleting account.");
    }
  };

  const saveProfileChanges = async () => {
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName.trim(),
        photoURL: newPhoto.trim() || null,
      });
      alert("Profile updated!");
      setIsEditing(false);
    } catch {
      alert("Could not update profile.");
    }
  };

  const updatePasswordFlow = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        oldPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      alert("Password updated!");
      setIsChangingPassword(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") alert("Wrong password.");
      else alert("Could not update password.");
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <h1>Your Profile</h1>
          <p>Manage your account & settings</p>
        </div>

        {/* Avatar */}
        <div className="avatar-section">
          <div className="avatar-ring">
            <img
              src={user?.photoURL || "/default-avatar.png"}
              className="avatar-img"
              alt="Avatar"
            />
          </div>
          <h2 className="profile-name">{user?.displayName || "No name set"}</h2>
          <p className="profile-email">{user?.email}</p>
        </div>

        {/* Buttons */}
        <div className="action-list">
          <button className="action-btn" onClick={() => setIsEditing(true)}>
            ✏️ Edit Profile
          </button>

          <button
            className="action-btn"
            onClick={() => setIsChangingPassword(true)}
          >
            🔐 Change Password
          </button>

          <Link to="/history" className="action-btn">
            📜 Parking History
          </Link>

          <button className="action-btn danger" onClick={handleDeleteAccount}>
            🗑 Delete Account
          </button>

          <button className="action-btn logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Edit Profile</h2>

            <input
              className="modal-input"
              placeholder="Display name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <input
              className="modal-input"
              placeholder="Photo URL"
              value={newPhoto}
              onChange={(e) => setNewPhoto(e.target.value)}
            />

            <div className="modal-buttons">
              <button className="save-btn" onClick={saveProfileChanges}>
                Save
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isChangingPassword && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Change Password</h2>

            <input
              type="password"
              className="modal-input"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <input
              type="password"
              className="modal-input"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <div className="modal-buttons">
              <button className="save-btn" onClick={updatePasswordFlow}>
                Update
              </button>
              <button
                className="cancel-btn"
                onClick={() => setIsChangingPassword(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;