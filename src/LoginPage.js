import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "./firebaseConfig";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // 🚀 Redirect logged-in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/parking");
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ Handle Google login
  const handleGoogleLogin = async () => {
    if (isLoggingIn) return; // Prevent multiple clicks
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      // Some mobile browsers block popups, so use redirect there
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      navigate("/parking");
    } catch (error) {
      console.error("Google login failed:", error.message);
      if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("Popup was closed before completing sign-in.");
      } else if (error.code === "auth/cancelled-popup-request") {
        setErrorMsg("Another login attempt was canceled. Please try again.");
      } else {
        setErrorMsg("Google login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ✅ Handle redirect results (for mobile Google login)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) navigate("/parking");
      })
      .catch((error) => {
        console.error("Redirect login error:", error.message);
      });
  }, [navigate]);

  // ✅ Handle email/password login or signup
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/parking");
    } catch (error) {
      console.error("Auth error:", error.message);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use. Try logging in instead.");
      } else if (error.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters long.");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h1>
        <p className="login-subtitle">
          {isSignup
            ? "Sign up to start using Pin My Park"
            : "Sign in to continue to Pin My Park"}
        </p>

        {errorMsg && <p className="error-text">{errorMsg}</p>}

        <form className="login-form" onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary-button">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          className="login-button"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          <span>{isLoggingIn ? "Signing in..." : "Continue with Google"}</span>
        </button>

        <p className="toggle-text">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsSignup(!isSignup);
              setErrorMsg("");
            }}
          >
            {isSignup ? "Login" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
